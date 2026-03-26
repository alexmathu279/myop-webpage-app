/**
 * lib/security/logger.ts
 * MYOP Healthcare Marketplace
 *
 * SECURITY LOGGING & MONITORING — OWASP A09 Logging Failures Prevention
 *
 * Structured logging for security events.
 * Never logs passwords, tokens, or full card numbers.
 *
 * In production, pipe logs to your preferred service:
 *   - Vercel Log Drains → Datadog / Logtail / Axiom
 *   - Replace console.* with your logging SDK
 *
 * Events logged:
 *   AUTH_SIGNUP           — new patient registration
 *   AUTH_SIGNIN           — successful login
 *   AUTH_SIGNIN_FAILED    — failed login attempt (rate limit trigger)
 *   AUTH_SIGNOUT          — user logout
 *   AUTH_INVITE_SENT      — staff invite issued
 *   AUTH_INVITE_ACCEPTED  — invite link used
 *   ONBOARDING_COMPLETE   — patient profile completed
 *   RATE_LIMIT_HIT        — rate limit exceeded
 *   ACCESS_DENIED         — RBAC rejection
 *   ADMIN_ACTION          — admin performed sensitive operation
 *   PAYMENT_INITIATED     — Razorpay order created
 *   PAYMENT_VERIFIED      — payment webhook received
 *   REFUND_REQUESTED      — refund initiated
 */

// =============================================================================
// TYPES
// =============================================================================

export type SecurityEventType =
  | 'AUTH_SIGNUP'
  | 'AUTH_SIGNIN'
  | 'AUTH_SIGNIN_FAILED'
  | 'AUTH_SIGNOUT'
  | 'AUTH_INVITE_SENT'
  | 'AUTH_INVITE_ACCEPTED'
  | 'ONBOARDING_COMPLETE'
  | 'RATE_LIMIT_HIT'
  | 'ACCESS_DENIED'
  | 'ADMIN_ACTION'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_VERIFIED'
  | 'REFUND_REQUESTED'
  | 'SUSPICIOUS_INPUT'
  | 'VALIDATION_FAILED'

export type SecurityEventSeverity = 'info' | 'warn' | 'error' | 'critical'

export interface SecurityEvent {
  event:     SecurityEventType
  severity:  SecurityEventSeverity
  timestamp: string
  userId?:   string          // UUID — never email or name
  ip?:       string
  userAgent?: string
  path?:     string
  details?:  Record<string, unknown>  // NEVER include passwords/tokens
}

// =============================================================================
// SEVERITY MAP
// =============================================================================

const EVENT_SEVERITY: Record<SecurityEventType, SecurityEventSeverity> = {
  AUTH_SIGNUP:          'info',
  AUTH_SIGNIN:          'info',
  AUTH_SIGNIN_FAILED:   'warn',
  AUTH_SIGNOUT:         'info',
  AUTH_INVITE_SENT:     'info',
  AUTH_INVITE_ACCEPTED: 'info',
  ONBOARDING_COMPLETE:  'info',
  RATE_LIMIT_HIT:       'warn',
  ACCESS_DENIED:        'warn',
  ADMIN_ACTION:         'info',
  PAYMENT_INITIATED:    'info',
  PAYMENT_VERIFIED:     'info',
  REFUND_REQUESTED:     'warn',
  SUSPICIOUS_INPUT:     'warn',
  VALIDATION_FAILED:    'info',
}

// =============================================================================
// LOGGER
// =============================================================================

class SecurityLogger {
  private formatEvent(event: SecurityEvent): string {
    return JSON.stringify({
      ...event,
      // Ensure timestamp is always present
      timestamp: event.timestamp ?? new Date().toISOString(),
    })
  }

  /**
   * Log a security event.
   * All events are structured JSON for easy parsing by log aggregators.
   */
  log(
    eventType: SecurityEventType,
    details?: Omit<SecurityEvent, 'event' | 'severity' | 'timestamp'>,
  ): void {
    const severity = EVENT_SEVERITY[eventType]
    const event: SecurityEvent = {
      event:     eventType,
      severity,
      timestamp: new Date().toISOString(),
      ...details,
    }

    // Redact any accidental sensitive data
    if (event.details) {
      event.details = this.redactSensitive(event.details)
    }

    const formatted = this.formatEvent(event)

    switch (severity) {
      case 'critical':
      case 'error':
        console.error('[SECURITY]', formatted)
        break
      case 'warn':
        console.warn('[SECURITY]', formatted)
        break
      default:
        console.log('[SECURITY]', formatted)
    }

    // In production, also send to external monitoring:
    // await sendToDatadog(event)
    // await sendToSlack(event)  // for 'critical' events
  }

  /**
   * Remove sensitive fields from log details.
   * Defence-in-depth against accidental password/token logging.
   */
  private redactSensitive(obj: Record<string, unknown>): Record<string, unknown> {
    const SENSITIVE_KEYS = new Set([
      'password', 'token', 'secret', 'key', 'authorization',
      'cookie', 'session', 'cvv', 'card_number', 'pan',
      'confirm_password', 'new_password', 'current_password',
      'razorpay_signature', 'service_role_key',
    ])

    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      result[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : v
    }
    return result
  }

  // Convenience methods
  rateLimitHit(ip: string, path: string, userId?: string) {
    this.log('RATE_LIMIT_HIT', { ip, path, userId, details: { path } })
  }

  accessDenied(userId: string, path: string, reason: string) {
    this.log('ACCESS_DENIED', { userId, path, details: { reason } })
  }

  authFailed(ip: string, details?: Record<string, unknown>) {
    this.log('AUTH_SIGNIN_FAILED', { ip, details })
  }

  suspiciousInput(ip: string, field: string, userId?: string) {
    this.log('SUSPICIOUS_INPUT', { ip, userId, details: { field } })
  }

  adminAction(userId: string, action: string, targetId?: string) {
    this.log('ADMIN_ACTION', { userId, details: { action, targetId } })
  }
}

export const securityLogger = new SecurityLogger()