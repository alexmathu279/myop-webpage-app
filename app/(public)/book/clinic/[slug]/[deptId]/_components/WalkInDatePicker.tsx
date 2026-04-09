'use client'

/**
 * app/(public)/book/clinic/[slug]/[deptId]/_components/WalkInDatePicker.tsx
 *
 * Shown when a clinic department has no doctors.
 * Patient picks a date → goes to /book/confirm/clinic
 * Login gate if not authenticated.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  clinicSlug:  string
  deptId:      string
  deptName:    string
  fee:         number | null
  isLoggedIn:  boolean
}

export default function WalkInDatePicker({
  clinicSlug,
  deptId,
  deptName,
  fee,
  isLoggedIn,
}: Props) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState('')
  const [showModal,    setShowModal]    = useState(false)

  const minDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  })()

  const maxDate = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })()

  function confirmUrl(): string {
    return `/book/confirm/clinic?clinic=${clinicSlug}&dept=${deptId}&date=${selectedDate}`
  }

  function handleProceed() {
    if (!selectedDate) return
    if (!isLoggedIn) {
      setShowModal(true)
      return
    }
    router.push(confirmUrl())
  }

  function goToLogin() {
    setShowModal(false)
    router.push(`/auth/login?redirectTo=${encodeURIComponent(confirmUrl())}`)
  }

  function goToSignup() {
    setShowModal(false)
    router.push(`/auth/signup?redirectTo=${encodeURIComponent(confirmUrl())}`)
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-md">
        <h2 className="font-semibold text-gray-900 mb-1">Select a Visit Date</h2>
        <p className="text-sm text-gray-500 mb-5">
          Walk-in appointment for <span className="font-medium text-gray-700">{deptName}</span>.
          Choose a date and we&apos;ll confirm your slot.
        </p>

        {/* Date picker */}
        <div className="mb-5">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            <Calendar size={12} />
            Visit date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={minDate}
            max={maxDate}
            className="w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        {/* Fee */}
        {fee !== null && (
          <div className="flex items-center justify-between mb-5 p-3 bg-violet-50 rounded-xl">
            <span className="text-sm text-gray-600">Consultation fee</span>
            <span className="font-bold text-gray-900">₹{fee.toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* Proceed button */}
        <button
          type="button"
          onClick={handleProceed}
          disabled={!selectedDate}
          className={cn(
            'w-full h-11 rounded-xl font-semibold text-sm transition-all',
            selectedDate
              ? 'bg-violet-600 text-white hover:bg-violet-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed',
          )}
        >
          {isLoggedIn ? 'Proceed to confirm →' : 'Sign in to book →'}
        </button>
      </div>

      {/* Login modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <div className="text-4xl mb-3">💊</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to book</h2>
            <p className="text-sm text-gray-500 mb-5">
              Sign in to confirm your clinic appointment. Your selected date will be saved.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={goToLogin} className="h-11 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 transition-colors">
                Sign in
              </button>
              <button onClick={goToSignup} className="h-11 bg-gray-50 text-gray-800 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors">
                Create free account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}