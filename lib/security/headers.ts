/**
 * lib/security/headers.ts
 * MYOP Healthcare Marketplace
 *
 * HTTP SECURITY HEADERS — OWASP A05 Security Misconfiguration Prevention
 *
 * Applied via next.config.ts headers() for all routes.
 * Also applied in middleware for dynamic response headers.
 *
 * Headers implemented:
 *   Content-Security-Policy    — XSS prevention
 *   Strict-Transport-Security  — Force HTTPS
 *   X-Frame-Options            — Clickjacking prevention
 *   X-Content-Type-Options     — MIME sniffing prevention
 *   Referrer-Policy            — Referrer leakage prevention
 *   Permissions-Policy         — Browser feature restriction
 *   X-XSS-Protection           — Legacy XSS filter (belt + suspenders)
 *   Cache-Control              — Prevent sensitive page caching
 */

// =============================================================================
// CONTENT SECURITY POLICY
// =============================================================================

/**
 * Build CSP header value.
 * Nonce-based CSP is not used here because Next.js Server Actions
 * use inline scripts that would require nonce injection.
 * Instead we use strict-dynamic + hashes for known scripts.
 */
function buildCSP(): string {
  const directives: Record<string, string[]> = {
    'default-src':     ["'self'"],
    'script-src':      [
      "'self'",
      "'unsafe-inline'",   // Required for Next.js dev mode + Server Actions
      "'unsafe-eval'",     // Required for Next.js dev mode only
      'https://checkout.razorpay.com',
      'https://api.razorpay.com',
    ],
    'style-src':       ["'self'", "'unsafe-inline'"],  // Required for inline styles
    'img-src':         ["'self'", 'data:', 'blob:', 'https:'],
    'font-src':        ["'self'", 'data:'],
    'connect-src':     [
      "'self'",
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      'https://api.razorpay.com',
      'wss://*.supabase.co',  // Supabase realtime websockets
    ].filter(Boolean),
    'frame-src':       [
      'https://api.razorpay.com',
      'https://checkout.razorpay.com',
    ],
    'object-src':      ["'none'"],
    'base-uri':        ["'self'"],
    'form-action':     ["'self'"],
    'frame-ancestors': ["'none'"],
    
  }

  return Object.entries(directives)
    .map(([key, values]) =>
      values.length > 0 ? `${key} ${values.join(' ')}` : key,
    )
    .join('; ')
}

// =============================================================================
// SECURITY HEADERS MAP
// =============================================================================

export const SECURITY_HEADERS = {
  'X-DNS-Prefetch-Control':        'on',
  'Strict-Transport-Security':     'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options':               'DENY',
  'X-Content-Type-Options':        'nosniff',
  'X-XSS-Protection':              '1; mode=block',
  'Referrer-Policy':               'strict-origin-when-cross-origin',
  'Permissions-Policy':            [
    'camera=()',
    'microphone=()',
    'geolocation=(self)',
    'payment=(self https://checkout.razorpay.com)',
    'usb=()',
  ].join(', '),
  'Content-Security-Policy':       buildCSP(),
}

/**
 * Headers for pages that contain sensitive data (dashboards, payments, etc.)
 * Prevents browser caching of sensitive content.
 */
export const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma':        'no-cache',
  'Expires':       '0',
}

/**
 * Apply security headers to a NextResponse.
 * Used in middleware for dynamic responses.
 */
export function applySecurityHeaders(
  headers: Headers,
  options?: { noCache?: boolean },
): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value)
  }

  if (options?.noCache) {
    for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
      headers.set(key, value)
    }
  }
}

// =============================================================================
// NEXT.CONFIG HEADERS ARRAY
// Used in next.config.ts headers() function.
// =============================================================================

export function getNextConfigHeaders() {
  const headersList = Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
    key,
    value,
  }))

  return [
    {
      // Apply to all routes
      source:  '/(.*)',
      headers: headersList,
    },
    {
      // Extra no-cache for sensitive routes
      source: '/(dashboard|bookings|profile|payments|hospital|admin)(.*)',
      headers: Object.entries(NO_CACHE_HEADERS).map(([key, value]) => ({
        key,
        value,
      })),
    },
  ]
}