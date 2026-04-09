'use client'

/**
 * app/(auth)/auth/login/page.tsx
 * Updated — reads ?redirectTo= query param and passes to signIn action
 */

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { signIn } from '@/lib/auth/actions'
import {
  AuthCard,
  AuthHeading,
  FormField,
  PasswordField,
  SubmitButton,
  ErrorBanner,
  FormStack,
  TextLink,
} from '@/components/auth'
import type { ActionResult } from '@/types/dto'

const initialState: ActionResult = { success: true, data: undefined }

function LoginForm() {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    signIn,
    initialState,
  )

  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirectTo') ?? ''

  return (
    <AuthCard>
      <AuthHeading
        title="Welcome back"
        subtitle="Sign in to your MYOP Health account"
      />

      <form action={formAction} noValidate>
        <FormStack>
          {!state.success && <ErrorBanner message={state.error} />}

          {/* Hidden field carries redirectTo into the server action */}
          {redirectTo && (
            <input type="hidden" name="redirectTo" value={redirectTo} />
          )}

          <FormField
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />

          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />

          <SubmitButton label="Sign in" pendingLabel="Signing in…" />
        </FormStack>
      </form>

      <p className="login-footer">
        New patient?{' '}
        <TextLink href={redirectTo ? `/auth/signup?redirectTo=${encodeURIComponent(redirectTo)}` : '/auth/signup'}>
          Create an account
        </TextLink>
      </p>

      <div className="login-register-note">
        <span>Hospital, Clinic or Diagnostic Centre?</span>
        <a href="/register" className="register-link">Register Now →</a>
      </div>
    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <>
      <Suspense>
        <LoginForm />
      </Suspense>

      <style>{`
        .login-footer {
          margin-top: 20px;
          text-align: center;
          font-size: 13px;
          color: var(--myop-muted);
        }
        .login-register-note {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px;
          background: #f0fdfa;
          border-radius: var(--radius-sm);
          border: 1px solid #99f6e4;
          font-size: 12px;
          color: var(--myop-muted);
          text-align: center;
        }
        .login-register-note span:first-child {
          font-weight: 500;
          color: var(--myop-slate);
        }
        .register-link {
          color: var(--myop-teal);
          font-weight: 600;
          text-decoration: none;
          font-size: 13px;
        }
        .register-link:hover { text-decoration: underline; }
      `}</style>
    </>
  )
}