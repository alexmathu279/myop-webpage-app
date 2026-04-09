'use client'

/**
 * app/(hospital)/hospital/dashboard/setup-form.tsx
 * First-time staff account setup — shown when is_onboarded = false
 */

import { useActionState, useEffect } from 'react'
import { completeStaffSetup } from '@/lib/auth/actions'
import type { ActionResult } from '@/types/dto'

const initialState: ActionResult = { success: true, data: undefined }

export default function StaffSetupForm({ currentName }: { currentName: string }) {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    completeStaffSetup,
    initialState,
  )

  // Reload page after successful setup to show the real dashboard
  useEffect(() => {
    if (state.success && (state as any).data === 'setup_complete') {
      window.location.reload()
    }
  }, [state])

  return (
    <div className="setup-shell">
      <div className="setup-card">
        <div className="setup-card__icon">👋</div>
        <h1 className="setup-card__title">Welcome to MYOP Health</h1>
        <p className="setup-card__sub">
          Set up your account to get started. You only need to do this once.
        </p>

        {!state.success && (
          <div className="alert alert--error">⚠ {state.error}</div>
        )}

        <form action={formAction} noValidate className="setup-form">
          <div className="form-field">
            <label className="form-field__label" htmlFor="full_name">
              Your full name <span className="req">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              className="form-field__input"
              defaultValue={currentName}
              placeholder="e.g. Ajil Antony"
              required
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="password">
              Create password <span className="req">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-field__input"
              placeholder="Minimum 8 characters"
              required
              minLength={8}
            />
          </div>

          <div className="form-field">
            <label className="form-field__label" htmlFor="confirm_password">
              Confirm password <span className="req">*</span>
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              className="form-field__input"
              placeholder="Re-enter your password"
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="submit-btn">
            Complete setup →
          </button>
        </form>
      </div>

      <style>{`
        .setup-shell {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          padding: 24px;
        }
        .setup-card {
          background: #fff;
          border: 1px solid var(--myop-border);
          border-radius: var(--radius-lg);
          padding: 40px 36px;
          max-width: 420px;
          width: 100%;
          text-align: center;
        }
        .setup-card__icon { font-size: 40px; margin-bottom: 12px; }
        .setup-card__title {
          font-size: 22px; font-weight: 800;
          color: var(--myop-slate); letter-spacing: -0.5px;
          margin-bottom: 8px;
        }
        .setup-card__sub {
          font-size: 14px; color: var(--myop-muted);
          line-height: 1.5; margin-bottom: 28px;
        }
        .alert {
          padding: 10px 14px; border-radius: var(--radius-sm);
          font-size: 13px; font-weight: 500;
          margin-bottom: 20px; text-align: left;
        }
        .alert--error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .setup-form { display: flex; flex-direction: column; gap: 16px; text-align: left; }
        .form-field { display: flex; flex-direction: column; gap: 5px; }
        .form-field__label { font-size: 13px; font-weight: 600; color: var(--myop-slate); }
        .req { color: var(--myop-error); }
        .form-field__input {
          height: 44px; padding: 0 12px;
          border: 1.5px solid var(--myop-border);
          border-radius: var(--radius-sm);
          font-size: 14px; color: var(--myop-slate);
          background: #fff; outline: none;
          font-family: inherit; width: 100%;
          transition: border-color 0.15s;
        }
        .form-field__input:focus {
          border-color: var(--myop-teal);
          box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
        }
        .submit-btn {
          height: 46px; padding: 0 24px;
          background: var(--myop-teal); color: #fff;
          border: none; border-radius: var(--radius-sm);
          font-size: 15px; font-weight: 700;
          cursor: pointer; transition: background 0.15s;
          margin-top: 4px;
        }
        .submit-btn:hover { background: var(--myop-teal-dark); }
      `}</style>
    </div>
  )
}