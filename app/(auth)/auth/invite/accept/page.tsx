/**
 * app/(auth)/auth/invite/accept/page.tsx
 * MYOP Healthcare Marketplace
 *
 * Invite acceptance page for hospital staff and admin accounts.
 *
 * Flow:
 *   1. Admin issues invite via inviteStaffMember() server action
 *   2. Supabase sends invite email with a magic link to this URL
 *   3. User clicks link → /auth/callback?type=invite → redirected here
 *      (at this point the Supabase session is already active)
 *   4. User enters their name and sets a password
 *   5. acceptInvite() action saves profile + redirects to role dashboard
 *
 * The session is validated in the server action — if somehow a user
 * reaches this page without a valid invite session they get an error.
 */

'use client'

import { useActionState } from 'react'
import { acceptInvite } from '@/lib/auth/actions'
import {
  AuthCard,
  AuthHeading,
  FormField,
  PasswordField,
  SubmitButton,
  ErrorBanner,
  FormStack,
} from '@/components/auth'
import type { ActionResult } from '@/types/dto'

const initialState: ActionResult = { success: true, data: undefined }

export default function InviteAcceptPage() {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    acceptInvite,
    initialState,
  )

  return (
    <>
      <div className="invite-badge">
        <span className="invite-badge__icon">✉</span>
        You have been invited to join MYOP Health
      </div>

      <AuthCard>
        <AuthHeading
          title="Set up your account"
          subtitle="Enter your name and choose a password to get started"
        />

        <form action={formAction} noValidate>
          <FormStack>
            {!state.success && <ErrorBanner message={state.error} />}

            <FormField
              label="Your full name"
              name="full_name"
              type="text"
              autoComplete="name"
              placeholder="Dr. Priya Nair"
              required
            />

            <PasswordField
              label="Choose a password"
              name="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              hint="Minimum 8 characters"
              required
            />

            <PasswordField
              label="Confirm password"
              name="confirm_password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              required
            />

            <SubmitButton
              label="Activate account"
              pendingLabel="Activating…"
            />
          </FormStack>
        </form>
      </AuthCard>

      <style>{`
        .invite-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--myop-teal-light);
          border: 1px solid #99f6e4;
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 500;
          color: var(--myop-teal-dark);
          margin-bottom: 20px;
        }
        .invite-badge__icon {
          font-size: 16px;
          flex-shrink: 0;
        }
      `}</style>
    </>
  )
}