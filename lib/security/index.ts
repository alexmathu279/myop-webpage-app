/**
 * lib/security/index.ts
 * MYOP Healthcare Marketplace
 *
 * Barrel export for all security utilities.
 * Import from '@/lib/security' throughout the codebase.
 */

export {
  sanitizeString,
  sanitizeObject,
  validateForm,
  SignUpSchema,
  SignInSchema,
  AcceptInviteSchema,
  OnboardingSchema,
  InviteStaffSchema,
} from './validation'

export type { ValidationResult } from './validation'

export {
  RATE_LIMITS,
  getClientIp,
  checkRateLimit,
  rateLimitAction,
  rateLimitRoute,
} from './rate-limit'

export {
  SECURITY_HEADERS,
  NO_CACHE_HEADERS,
  applySecurityHeaders,
  getNextConfigHeaders,
} from './headers'

export {
  securityLogger,
} from './logger'

export type {
  SecurityEvent,
  SecurityEventType,
  SecurityEventSeverity,
} from './logger'