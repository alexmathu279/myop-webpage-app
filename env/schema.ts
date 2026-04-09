/**
 * env/schema.ts
 * MYOP Healthcare Marketplace
 *
 * Environment variable validation with Zod.
 * Fails fast at startup if required variables are missing.
 * Prevents silent failures from misconfigured deployments.
 *
 * SECURITY: Separates server-only vars from public vars.
 * Server vars are never included in the browser bundle.
 */

import { z } from 'zod'

// =============================================================================
// SERVER-ONLY ENVIRONMENT VARIABLES
// These are NEVER exposed to the browser.
// =============================================================================

const serverSchema = z.object({
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z
    .string({ error: 'SUPABASE_SERVICE_ROLE_KEY is required' })
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY cannot be empty')
    .refine(
      v => !v.startsWith('NEXT_PUBLIC_'),
      'Service role key must NOT have NEXT_PUBLIC_ prefix',
    ),

  // Razorpay
  RAZORPAY_KEY_SECRET: z
    .string({ error: 'RAZORPAY_KEY_SECRET is required' })
    .min(1),

  RAZORPAY_WEBHOOK_SECRET: z
    .string({ error: 'RAZORPAY_WEBHOOK_SECRET is required' })
    .min(1),

  // Resend
  RESEND_API_KEY: z
    .string({ error: 'RESEND_API_KEY is required' })
    .min(1),

  RESEND_FROM_EMAIL: z
    .string({ error: 'RESEND_FROM_EMAIL is required' })
    .email('RESEND_FROM_EMAIL must be a valid email'),

  // Security
  CSRF_SECRET: z
    .string({ error: 'CSRF_SECRET is required' })
    .min(32, 'CSRF_SECRET must be at least 32 characters'),

  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
})

// =============================================================================
// PUBLIC (CLIENT-SAFE) ENVIRONMENT VARIABLES
// These may be included in the browser bundle.
// =============================================================================

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ error: 'NEXT_PUBLIC_SUPABASE_URL is required' })
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required' })
    .min(1),

  NEXT_PUBLIC_APP_URL: z
    .string({ error: 'NEXT_PUBLIC_APP_URL is required' })
    .url('NEXT_PUBLIC_APP_URL must be a valid URL'),

  NEXT_PUBLIC_RAZORPAY_KEY_ID: z
    .string({ error: 'NEXT_PUBLIC_RAZORPAY_KEY_ID is required' })
    .min(1)
    .refine(v => v.startsWith('rzp_'), 'Razorpay key ID must start with rzp_'),
})

// =============================================================================
// VALIDATION
// =============================================================================

type ServerEnv = z.infer<typeof serverSchema>
type ClientEnv = z.infer<typeof clientSchema>

let serverEnv: ServerEnv
let clientEnv: ClientEnv

/**
 * Validate and return server environment variables.
 * Call this in server-only code (Server Components, API routes, actions).
 * Throws on missing/invalid variables.
 */
export function getServerEnv(): ServerEnv {
  if (serverEnv) return serverEnv

  const result = serverSchema.safeParse(process.env)

  if (!result.success) {
    const missing = result.error.issues
      .map(e => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n')
    throw new Error(
      `Missing or invalid server environment variables:\n${missing}\n` +
      'Check your .env.local file.',
    )
  }

  serverEnv = result.data
  return serverEnv
}

/**
 * Validate and return public environment variables.
 * Safe to call anywhere.
 */
export function getClientEnv(): ClientEnv {
  if (clientEnv) return clientEnv

  const result = clientSchema.safeParse(process.env)

  if (!result.success) {
    const missing = result.error.issues
      .map(e => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n')
    throw new Error(
      `Missing or invalid public environment variables:\n${missing}\n` +
      'Check your .env.local file.',
    )
  }

  clientEnv = result.data
  return clientEnv
}

/**
 * Validate ALL environment variables at startup.
 * Call this in instrumentation.ts or app/layout.tsx server side.
 */
export function validateEnv(): void {
  getServerEnv()
  getClientEnv()
  console.log('[env] All environment variables validated ✓')
}