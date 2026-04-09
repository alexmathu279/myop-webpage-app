'use client'

/**
 * app/(auth)/auth/signup/page.tsx
 * Updated — reads ?redirectTo= query param, passes to signUp action,
 * and links back to login preserving redirectTo.
 */

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { signUp } from '@/lib/auth/actions'
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

function SignupForm() {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    signUp,
    initialState,
  )

  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirectTo') ?? ''

  return (
    <AuthCard>
      <AuthHeading
        title="Create your account"
        subtitle="Book appointments, lab tests, and more"
      />

      <form action={formAction} noValidate>
        <FormStack>
          {!state.success && <ErrorBanner message={state.error} />}

          {/* Carry redirectTo so after email confirm + onboarding we return */}
          {redirectTo && (
            <input type="hidden" name="redirectTo" value={redirectTo} />
          )}

          <FormField
            label="Full name"
            name="full_name"
            type="text"
            autoComplete="name"
            placeholder="Arjun Menon"
            required
          />

          <FormField
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />

          <FormField
            label="Mobile number"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="98765 43210"
            hint="10-digit Indian mobile number"
            required
          />

          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hint="Minimum 8 characters"
            required
          />

          <SubmitButton label="Create account" pendingLabel="Creating account…" />
        </FormStack>
      </form>

      <p className="signup-terms">
        By creating an account you agree to our{' '}
        <TextLink href="/terms">Terms of Service</TextLink> and{' '}
        <TextLink href="/privacy">Privacy Policy</TextLink>.
      </p>

      <p className="signup-footer">
        Already have an account?{' '}
        <TextLink href={redirectTo ? `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/auth/login'}>
          Sign in
        </TextLink>
      </p>
    </AuthCard>
  )
}

export default function SignupPage() {
  return (
    <>
      <Suspense>
        <SignupForm />
      </Suspense>

      <style>{`
        .signup-terms {
          margin-top: 16px;
          font-size: 11px;
          color: var(--myop-muted);
          text-align: center;
          line-height: 1.5;
        }
        .signup-footer {
          margin-top: 12px;
          text-align: center;
          font-size: 13px;
          color: var(--myop-muted);
        }
      `}</style>
    </>
  )
}