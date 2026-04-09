/**
 * lib/security/rate-limit.ts
 * MYOP Healthcare Marketplace
 *
 * RATE LIMITING — OWASP A07 Authentication Failures Prevention
 *
 * In-memory rate limiter for Next.js Edge Middleware and API routes.
 * Uses a sliding window algorithm per (IP + endpoint) key.
 *
 * For production, replace the in-memory store with Redis/Upstash:
 *   npm install @upstash/ratelimit @upstash/redis
 *   and swap the store implementation below.
 *
 * Limits (sensible defaults per OWASP recommendations):
 *   auth/login    — 5 attempts per 15 minutes per IP
 *   auth/signup   — 3 attempts per 1 hour per IP
 *   auth/onboard  — 10 attempts per 1 hour per IP
 *   api/*         — 60 requests per 1 minute per IP
 *   admin/*       — 30 requests per 1 minute per IP+userId
 */

import { NextRequest, NextResponse } from 'next/server'

// =============================================================================
// TYPES
// =============================================================================

interface RateLimitWindow {
  count:     number
  resetAt:   number   // Unix timestamp ms
}

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit:       number
  /** Window size in milliseconds */
  windowMs:    number
  /** Human-readable window description for 429 message */
  windowLabel: string
}

// =============================================================================
// IN-MEMORY STORE
// Replace with Redis for multi-instance production deployments.
// =============================================================================

const store = new Map<string, RateLimitWindow>()

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, window] of store.entries()) {
      if (now > window.resetAt) {
        store.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

// =============================================================================
// RATE LIMIT CONFIGURATIONS
// =============================================================================

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'auth:login':    { limit: 5,  windowMs: 15 * 60 * 1000, windowLabel: '15 minutes' },
  'auth:signup':   { limit: 3,  windowMs: 60 * 60 * 1000, windowLabel: '1 hour'     },
  'auth:onboard':  { limit: 10, windowMs: 60 * 60 * 1000, windowLabel: '1 hour'     },
  'auth:invite':   { limit: 10, windowMs: 60 * 60 * 1000, windowLabel: '1 hour'     },
  'api:general':   { limit: 60, windowMs: 60 * 1000,       windowLabel: '1 minute'   },
  'api:admin':     { limit: 30, windowMs: 60 * 1000,       windowLabel: '1 minute'   },
}

// =============================================================================
// IP EXTRACTION
// =============================================================================

/**
 * Extract the real client IP from the request.
 * Handles Vercel, Cloudflare, and direct connections.
 */
export function getClientIp(request: NextRequest): string {
  // Vercel
  const vercelIp = request.headers.get('x-real-ip')
  if (vercelIp) return vercelIp

  // Cloudflare
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp

  // Standard forwarded header (take first IP only — don't trust full chain)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  // Fallback
  return '127.0.0.1'
}

// =============================================================================
// CORE RATE LIMITER
// =============================================================================

interface RateLimitResult {
  allowed:    boolean
  remaining:  number
  resetAt:    number
  retryAfter: number   // seconds
}

/**
 * Check and increment rate limit for a given key.
 *
 * @param key    Unique identifier — typically `${configKey}:${ip}` or `${configKey}:${userId}`
 * @param config Rate limit configuration
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || now > existing.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return {
      allowed:    true,
      remaining:  config.limit - 1,
      resetAt:    now + config.windowMs,
      retryAfter: 0,
    }
  }

  if (existing.count >= config.limit) {
    return {
      allowed:    false,
      remaining:  0,
      resetAt:    existing.resetAt,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    }
  }

  existing.count++
  return {
    allowed:    true,
    remaining:  config.limit - existing.count,
    resetAt:    existing.resetAt,
    retryAfter: 0,
  }
}

// =============================================================================
// SERVER ACTION RATE LIMITER
// Called at the top of each server action.
// Returns ActionResult-compatible error or null if allowed.
// =============================================================================

/**
 * Rate-limit a server action by IP.
 * Returns an error result if rate limited, null if allowed.
 *
 * @example
 * const limited = await rateLimitAction(request, 'auth:login')
 * if (limited) return limited
 */
export async function rateLimitAction(
  configKey: keyof typeof RATE_LIMITS,
  ip: string,
  userId?: string,
): Promise<{ success: false; error: string } | null> {
  const config = RATE_LIMITS[configKey]
  if (!config) return null

  // Use userId if available for more precise limiting, fallback to IP
  const key = userId
    ? `${configKey}:user:${userId}`
    : `${configKey}:ip:${ip}`

  const result = checkRateLimit(key, config)

  if (!result.allowed) {
    return {
      success: false,
      error:   `Too many attempts. Please try again in ${result.retryAfter} seconds.`,
    }
  }

  return null
}

// =============================================================================
// MIDDLEWARE RATE LIMITER
// Returns a 429 response or null if allowed.
// Used in middleware.ts for route-level limiting.
// =============================================================================

/**
 * Rate-limit a route in middleware.
 * Returns a 429 NextResponse if limited, null if allowed.
 */
export function rateLimitRoute(
  request: NextRequest,
  configKey: keyof typeof RATE_LIMITS,
): NextResponse | null {
  const ip = getClientIp(request)
  const config = RATE_LIMITS[configKey]
  if (!config) return null

  const key = `${configKey}:ip:${ip}`
  const result = checkRateLimit(key, config)

  if (!result.allowed) {
    return new NextResponse(
      JSON.stringify({
        error:      'Too many requests.',
        retryAfter: result.retryAfter,
        message:    `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
      }),
      {
        status:  429,
        headers: {
          'Content-Type':    'application/json',
          'Retry-After':     String(result.retryAfter),
          'X-RateLimit-Limit':     String(config.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset':     String(Math.ceil(result.resetAt / 1000)),
        },
      },
    )
  }

  return null
}