/**
 * components/auth/index.tsx
 * MYOP Healthcare Marketplace
 *
 * Shared UI primitives used across all auth pages.
 * All are Client Components where interactivity is needed,
 * or plain markup helpers.
 *
 * Exports:
 *   AuthCard        — white card container
 *   FormField       — labelled input with error display
 *   PasswordField   — FormField variant with show/hide toggle
 *   SubmitButton    — button that shows pending state from useFormStatus
 *   ErrorBanner     — top-level form error (from server action result)
 *   SuccessBanner   — success confirmation
 *   Divider         — visual "or" separator
 */

'use client'

import { useFormStatus } from 'react-dom'
import { useState, type InputHTMLAttributes, type ReactNode } from 'react'

// ---------------------------------------------------------------------------
// AuthCard
// ---------------------------------------------------------------------------

export function AuthCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`auth-card ${className}`}>
      {children}
      <style>{`
        .auth-card {
          background: #ffffff;
          border: 1px solid var(--myop-border);
          border-radius: var(--radius-lg);
          padding: 36px 32px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04);
        }
        @media (max-width: 480px) {
          .auth-card { padding: 28px 20px; }
        }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AuthHeading
// ---------------------------------------------------------------------------

export function AuthHeading({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="auth-heading">
      <h2 className="auth-heading__title">{title}</h2>
      {subtitle && <p className="auth-heading__sub">{subtitle}</p>}
      <style>{`
        .auth-heading { margin-bottom: 28px; }
        .auth-heading__title {
          font-size: 22px;
          font-weight: 700;
          color: var(--myop-slate);
          letter-spacing: -0.5px;
          line-height: 1.2;
        }
        .auth-heading__sub {
          margin-top: 6px;
          font-size: 14px;
          color: var(--myop-muted);
          line-height: 1.5;
        }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FormField
// ---------------------------------------------------------------------------

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
  error?: string
  hint?: string
}

export function FormField({ label, name, error, hint, ...inputProps }: FormFieldProps) {
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={name}>
        {label}
        {inputProps.required && <span className="form-field__required" aria-hidden="true"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        aria-invalid={!!error}
        className={`form-field__input ${error ? 'form-field__input--error' : ''}`}
        {...inputProps}
      />
      {hint && !error && (
        <p id={`${name}-hint`} className="form-field__hint">{hint}</p>
      )}
      {error && (
        <p id={`${name}-error`} className="form-field__error" role="alert">{error}</p>
      )}
      <style>{`
        .form-field { display: flex; flex-direction: column; gap: 6px; }
        .form-field__label {
          font-size: 13px;
          font-weight: 600;
          color: var(--myop-slate);
          letter-spacing: 0.1px;
        }
        .form-field__required { color: var(--myop-error); }
        .form-field__input {
          height: 42px;
          padding: 0 12px;
          border: 1.5px solid var(--myop-border);
          border-radius: var(--radius-sm);
          font-size: 14px;
          color: var(--myop-slate);
          background: #fff;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
        }
        .form-field__input:focus {
          border-color: var(--myop-teal);
          box-shadow: 0 0 0 3px rgba(13,148,136,0.12);
        }
        .form-field__input--error {
          border-color: var(--myop-error);
        }
        .form-field__input--error:focus {
          box-shadow: 0 0 0 3px rgba(239,68,68,0.12);
        }
        .form-field__hint {
          font-size: 12px;
          color: var(--myop-muted);
        }
        .form-field__error {
          font-size: 12px;
          color: var(--myop-error);
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PasswordField — FormField with show/hide toggle
// ---------------------------------------------------------------------------

export function PasswordField({
  label,
  name,
  error,
  hint,
  ...inputProps
}: FormFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={name}>
        {label}
        {inputProps.required && (
          <span className="form-field__required" aria-hidden="true"> *</span>
        )}
      </label>
      <div className="pw-wrapper">
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
          aria-invalid={!!error}
          className={`form-field__input pw-input ${error ? 'form-field__input--error' : ''}`}
          {...inputProps}
        />
        <button
          type="button"
          className="pw-toggle"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
        >
          {visible ? '🙈' : '👁'}
        </button>
      </div>
      {hint && !error && (
        <p id={`${name}-hint`} className="form-field__hint">{hint}</p>
      )}
      {error && (
        <p id={`${name}-error`} className="form-field__error" role="alert">{error}</p>
      )}
      <style>{`
        .pw-wrapper { position: relative; }
        .pw-input { padding-right: 44px !important; }
        .pw-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
          line-height: 1;
          opacity: 0.6;
          transition: opacity 0.15s;
        }
        .pw-toggle:hover { opacity: 1; }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SubmitButton
// Reads pending state from the nearest <form> via useFormStatus.
// ---------------------------------------------------------------------------

export function SubmitButton({
  label,
  pendingLabel = 'Please wait…',
}: {
  label: string
  pendingLabel?: string
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="submit-btn"
    >
      {pending ? (
        <>
          <span className="submit-btn__spinner" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
      <style>{`
        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 44px;
          background: var(--myop-teal);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          letter-spacing: 0.1px;
          transition: background 0.15s, opacity 0.15s, transform 0.1s;
        }
        .submit-btn:hover:not(:disabled) {
          background: var(--myop-teal-dark);
        }
        .submit-btn:active:not(:disabled) {
          transform: scale(0.99);
        }
        .submit-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .submit-btn__spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </button>
  )
}

// ---------------------------------------------------------------------------
// ErrorBanner — displays top-level form errors from server actions
// ---------------------------------------------------------------------------

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null
  return (
    <div role="alert" className="error-banner">
      <span className="error-banner__icon" aria-hidden="true">⚠</span>
      {message}
      <style>{`
        .error-banner {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: var(--myop-error-bg);
          border: 1px solid #fecaca;
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          font-size: 13px;
          color: #b91c1c;
          font-weight: 500;
          line-height: 1.4;
        }
        .error-banner__icon { flex-shrink: 0; margin-top: 1px; }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SuccessBanner
// ---------------------------------------------------------------------------

export function SuccessBanner({ message }: { message: string }) {
  if (!message) return null
  return (
    <div role="status" className="success-banner">
      <span className="success-banner__icon" aria-hidden="true">✓</span>
      {message}
      <style>{`
        .success-banner {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          font-size: 13px;
          color: #166534;
          font-weight: 500;
        }
        .success-banner__icon { flex-shrink: 0; }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FormStack — vertical form layout with consistent gap
// ---------------------------------------------------------------------------

export function FormStack({ children }: { children: ReactNode }) {
  return (
    <div className="form-stack">
      {children}
      <style>{`
        .form-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TextLink — styled anchor for auth page cross-links
// ---------------------------------------------------------------------------

export function TextLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <a href={href} className="text-link">
      {children}
      <style>{`
        .text-link {
          color: var(--myop-teal);
          font-weight: 500;
          text-decoration: none;
          transition: color 0.15s;
        }
        .text-link:hover { color: var(--myop-teal-dark); text-decoration: underline; }
      `}</style>
    </a>
  )
}