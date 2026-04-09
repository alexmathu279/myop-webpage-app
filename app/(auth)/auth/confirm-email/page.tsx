'use client'

import { AuthCard, AuthHeading } from '@/components/auth'

export default function ConfirmEmailPage() {
  return (
    <AuthCard>
      <AuthHeading
        title="Check your email"
        subtitle="We sent a confirmation link to your email address"
      />

      <div className="confirm-body">
        <div className="confirm-icon">✉</div>
        <p>Click the link in the email to verify your account and continue setup.</p>
        <p className="confirm-note">
          Didn't receive it? Check your spam folder or{' '}
          <a href="/auth/signup" className="confirm-link">try signing up again</a>.
        </p>
      </div>

      <style>{`
        .confirm-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
          padding: 8px 0 4px;
        }
        .confirm-icon {
          font-size: 40px;
          margin-bottom: 4px;
        }
        .confirm-body p {
          font-size: 14px;
          color: var(--myop-muted);
          line-height: 1.6;
          max-width: 320px;
        }
        .confirm-note {
          font-size: 13px !important;
        }
        .confirm-link {
          color: var(--myop-teal);
          text-decoration: none;
          font-weight: 500;
        }
        .confirm-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </AuthCard>
  )
}