'use client'

/**
 * app/(public)/hospitals/[slug]/book/[doctorId]/_components/SlotsGrid.tsx
 *
 * KEY RULES:
 *   - Logged-in patient  → /book/confirm?slot=<slotId>  (directly)
 *   - Guest              → /auth/login?redirectTo=%2Fbook%2Fconfirm%3Fslot%3D<slotId>
 *   - redirectTo is always relative, always encoded, never contains https://
 *   - Only slotId is passed — doctor + hospital are derived server-side on confirm page
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Slot {
  id:         string
  slot_start: string
  slot_end:   string
  spots_left: number
}

interface Props {
  slots:           Slot[]
  selectedDate:    string
  doctorId:        string
  hospitalSlug:    string
  consultationFee: number
  isLoggedIn:      boolean
}

export default function SlotsGrid({
  slots,
  selectedDate,
  consultationFee,
  isLoggedIn,
}: Props) {
  const router = useRouter()

  const [showModal,   setShowModal]   = useState(false)
  const [pendingSlot, setPendingSlot] = useState<string | null>(null)

  /**
   * The confirm page URL — only slotId, nothing else.
   * Doctor and hospital are derived server-side from the slot record.
   * Always a relative path — never includes protocol or hostname.
   */
  function confirmUrl(slotId: string): string {
    return `/book/confirm?slot=${encodeURIComponent(slotId)}`
  }

  function handleSelectSlot(slotId: string) {
    if (isLoggedIn) {
      // Already logged in — go directly to confirm page
      router.push(confirmUrl(slotId))
      return
    }
    // Guest — show modal so they can choose login or signup
    setPendingSlot(slotId)
    setShowModal(true)
  }

  function goToLogin() {
    if (!pendingSlot) return
    // redirectTo is the confirm page — not the slot picker
    // This means after login the patient lands directly on the confirm page
    const redirectTo = encodeURIComponent(confirmUrl(pendingSlot))
    router.push(`/auth/login?redirectTo=${redirectTo}`)
  }

  function goToSignup() {
    if (!pendingSlot) return
    const redirectTo = encodeURIComponent(confirmUrl(pendingSlot))
    router.push(`/auth/signup?redirectTo=${redirectTo}`)
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <Clock size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium text-gray-500">No available slots</p>
        <p className="text-xs mt-1">
          No slots available on{' '}
          <span className="font-medium text-gray-600">
            {formatDisplayDate(selectedDate)}
          </span>
          . Try another day.
        </p>
      </div>
    )
  }

  return (
    <>
      <div>
        <p className="text-sm text-gray-500 mb-4">
          {slots.length} slot{slots.length !== 1 ? 's' : ''} available on{' '}
          <span className="font-medium text-gray-700">
            {formatDisplayDate(selectedDate)}
          </span>
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {slots.map((slot) => {
            const low = slot.spots_left === 1
            return (
              <button
                key={slot.id}
                onClick={() => handleSelectSlot(slot.id)}
                className={cn(
                  'flex flex-col items-center justify-center p-3 rounded-xl border text-sm',
                  'transition-all hover:border-teal-400 hover:bg-teal-50 hover:shadow-sm',
                  'border-gray-200 bg-white text-gray-700',
                  low && 'border-orange-200 bg-orange-50',
                )}
              >
                <span className="font-semibold">{formatTime(slot.slot_start)}</span>
                <span className="text-xs text-gray-400 mt-0.5">
                  to {formatTime(slot.slot_end)}
                </span>
                {low && (
                  <span className="text-[10px] text-orange-500 font-medium mt-1">
                    1 spot left
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {!isLoggedIn && (
          <p className="text-xs text-gray-400 mt-5 text-center">
            You&apos;ll be asked to sign in when selecting a slot.
          </p>
        )}
      </div>

      {/* ── Login / Signup Modal ── */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="modal-icon">🏥</div>
            <h2 className="modal-title">Sign in to book</h2>
            <p className="modal-sub">
              Create a free account or sign in to confirm your appointment.
              Your selected slot will be waiting.
            </p>

            {consultationFee > 0 && (
              <div className="modal-fee">
                Consultation fee:{' '}
                <strong>₹{consultationFee.toLocaleString('en-IN')}</strong>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="modal-btn modal-btn--primary"
                onClick={goToLogin}
              >
                Sign in
              </button>
              <button
                className="modal-btn modal-btn--ghost"
                onClick={goToSignup}
              >
                Create free account
              </button>
            </div>

            <p className="modal-note">
              Already have an account? Signing in takes 10 seconds.
            </p>
          </div>
        </div>
      )}

      <style>{`
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.6);
          backdrop-filter: blur(4px);
          z-index: 200;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: fadeIn 0.15s ease;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .modal-card {
          background: #fff; border-radius: 20px;
          padding: 36px 32px; max-width: 400px; width: 100%;
          text-align: center; position: relative;
          animation: slideUp 0.2s ease;
          box-shadow: 0 24px 64px rgba(0,0,0,0.2);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        .modal-close {
          position: absolute; top: 16px; right: 16px;
          background: #f1f5f9; border: none;
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #64748b; transition: background 0.15s;
        }
        .modal-close:hover { background: #e2e8f0; }
        .modal-icon { font-size: 40px; margin-bottom: 12px; }
        .modal-title {
          font-size: 20px; font-weight: 800; color: #0f172a;
          margin: 0 0 8px; letter-spacing: -0.4px;
        }
        .modal-sub {
          font-size: 14px; color: #64748b;
          line-height: 1.5; margin: 0 0 16px;
        }
        .modal-fee {
          display: inline-block; background: #f0fdfa;
          border: 1px solid #99f6e4; border-radius: 8px;
          padding: 8px 16px; font-size: 13px;
          color: #0f766e; margin-bottom: 20px;
        }
        .modal-fee strong { font-weight: 700; }
        .modal-actions { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
        .modal-btn {
          height: 46px; border-radius: 10px; font-size: 15px;
          font-weight: 600; cursor: pointer; border: none;
          transition: background 0.15s, transform 0.1s;
        }
        .modal-btn:hover { transform: translateY(-1px); }
        .modal-btn--primary { background: #0d9488; color: #fff; }
        .modal-btn--primary:hover { background: #0f766e; }
        .modal-btn--ghost { background: #f8fafc; color: #0f172a; border: 1.5px solid #e2e8f0; }
        .modal-btn--ghost:hover { background: #f1f5f9; }
        .modal-note { font-size: 12px; color: #94a3b8; margin: 0; }
      `}</style>
    </>
  )
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Kolkata',
  })
}

function formatDisplayDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'UTC',
  })
}