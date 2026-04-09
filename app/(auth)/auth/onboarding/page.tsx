'use client'

/**
 * app/(auth)/auth/onboarding/page.tsx
 * FIX: reads ?redirectTo= from URL (set by callback after email confirm),
 *      passes it as hidden field to completeOnboard,
 *      and after success redirects to state.data (the slot page or /dashboard).
 */

import { useActionState, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { completeOnboard } from '@/lib/auth/actions'
import {
  AuthCard,
  AuthHeading,
  FormField,
  SubmitButton,
  ErrorBanner,
  FormStack,
} from '@/components/auth'
import type { ActionResult } from '@/types/dto'

const initialState: ActionResult<string> = { success: false, error: '' }
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const GENDERS = [
  { value: 'male',              label: 'Male' },
  { value: 'female',            label: 'Female' },
  { value: 'other',             label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

// Inner component — needs useSearchParams so must be inside Suspense
function OnboardingForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // FIX: read redirectTo from URL — set by callback/route.ts after email confirm
  const redirectTo = searchParams.get('redirectTo') ?? ''

  const [state, formAction] = useActionState<ActionResult<string>, FormData>(
    completeOnboard,
    initialState,
  )

  const [step, setStep] = useState<1 | 2>(1)
  const [step1Values, setStep1Values] = useState({ date_of_birth: '', gender: '' })

  // FIX: after success, redirect to state.data
  // state.data is either the slot URL (if coming from booking) or '/dashboard'
  useEffect(() => {
    if (state.success && state.data) {
      router.push(state.data)
    }
  }, [state, router])

  function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd     = new FormData(e.currentTarget)
    const dob    = (fd.get('date_of_birth') as string).trim()
    const gender = (fd.get('gender') as string).trim()
    if (!dob || !gender) return
    setStep1Values({ date_of_birth: dob, gender })
    setStep(2)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <>
      <div className="onboard-progress" aria-label={`Step ${step} of 2`}>
        <div className={`onboard-progress__step ${step >= 1 ? 'is-active' : ''}`}>
          <span>1</span>
          Personal
        </div>
        <div className="onboard-progress__line" />
        <div className={`onboard-progress__step ${step >= 2 ? 'is-active' : ''}`}>
          <span>2</span>
          Location
        </div>
      </div>

      <AuthCard>
        {step === 1 && (
          <>
            <AuthHeading
              title="A little about you"
              subtitle="This helps us personalise your health experience"
            />
            <form onSubmit={handleStep1} noValidate>
              <FormStack>
                <FormField
                  label="Date of birth"
                  name="date_of_birth"
                  type="date"
                  max={today}
                  required
                />
                <div className="gender-field">
                  <p className="gender-field__label">
                    Gender <span aria-hidden="true" style={{ color: 'var(--myop-error)' }}> *</span>
                  </p>
                  <div className="gender-options" role="radiogroup" aria-label="Gender">
                    {GENDERS.map(({ value, label }) => (
                      <label key={value} className="gender-option">
                        <input
                          type="radio"
                          name="gender"
                          value={value}
                          required
                          className="gender-option__input"
                        />
                        <span className="gender-option__label">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="next-btn">Continue →</button>
              </FormStack>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <AuthHeading
              title="Almost there"
              subtitle="Just two more details — blood group is optional"
            />
            <form action={formAction} noValidate>
              {/* Hidden fields — carry step 1 values and the booking redirect */}
              <input type="hidden" name="date_of_birth"   value={step1Values.date_of_birth} />
              <input type="hidden" name="gender"          value={step1Values.gender} />
              {/* FIX: pass redirectTo to completeOnboard so it can return it in state.data */}
              {redirectTo && (
                <input type="hidden" name="booking_redirect" value={redirectTo} />
              )}
              <FormStack>
                {state.success === false && state.error && (
                  <ErrorBanner message={state.error} />
                )}
                <FormField
                  label="City"
                  name="city"
                  type="text"
                  placeholder="Kochi"
                  autoComplete="address-level2"
                  required
                />
                <div className="blood-field">
                  <label className="form-field__label" htmlFor="blood_group">
                    Blood group <span className="optional-tag">(optional)</span>
                  </label>
                  <select id="blood_group" name="blood_group" className="blood-select">
                    <option value="">Don&apos;t know / prefer not to say</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <SubmitButton label="Complete setup" pendingLabel="Saving…" />
              </FormStack>
            </form>
            <button type="button" className="back-btn" onClick={() => setStep(1)}>
              ← Back
            </button>
          </>
        )}
      </AuthCard>

      <style>{`
        .onboard-progress { display: flex; align-items: center; gap: 0; margin-bottom: 20px; }
        .onboard-progress__step { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--myop-muted); white-space: nowrap; }
        .onboard-progress__step span { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--myop-border); font-size: 11px; font-weight: 700; background: #fff; }
        .onboard-progress__step.is-active { color: var(--myop-teal); }
        .onboard-progress__step.is-active span { border-color: var(--myop-teal); background: var(--myop-teal); color: #fff; }
        .onboard-progress__line { flex: 1; height: 2px; background: var(--myop-border); margin: 0 12px; }
        .gender-field { display: flex; flex-direction: column; gap: 8px; }
        .gender-field__label { font-size: 13px; font-weight: 600; color: var(--myop-slate); }
        .gender-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .gender-option { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); cursor: pointer; transition: border-color 0.15s, background 0.15s; font-size: 13px; }
        .gender-option:has(.gender-option__input:checked) { border-color: var(--myop-teal); background: #f0fdfa; }
        .gender-option__input { accent-color: var(--myop-teal); }
        .blood-field { display: flex; flex-direction: column; gap: 6px; }
        .optional-tag { font-weight: 400; color: var(--myop-muted); font-size: 11px; margin-left: 4px; }
        .blood-select { height: 42px; padding: 0 12px; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); font-size: 14px; color: var(--myop-slate); background: #fff; outline: none; cursor: pointer; transition: border-color 0.15s; width: 100%; }
        .blood-select:focus { border-color: var(--myop-teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.12); }
        .next-btn { width: 100%; height: 44px; background: var(--myop-teal); color: #fff; font-size: 14px; font-weight: 600; border: none; border-radius: var(--radius-sm); cursor: pointer; transition: background 0.15s; }
        .next-btn:hover { background: var(--myop-teal-dark); }
        .back-btn { display: block; margin-top: 14px; background: none; border: none; font-size: 13px; color: var(--myop-muted); cursor: pointer; padding: 0; transition: color 0.15s; }
        .back-btn:hover { color: var(--myop-slate); }
      `}</style>
    </>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  )
}