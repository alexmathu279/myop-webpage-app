'use client'

/**
 * app/(public)/ambulance/status/[id]/_components/AmbulanceStatusClient.tsx
 *
 * Simulated status progression:
 *   requested → confirmed (after 15s) → on_the_way (after 45s) → arrived (after 10min)
 *
 * Data comes from server component — no API calls needed here.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Clock, Phone } from 'lucide-react'
import type { AmbulanceBooking } from '@/lib/ambulance/queries'

type StatusStep = 'requested' | 'confirmed' | 'on_the_way' | 'arrived'

const STATUS_STEPS: StatusStep[] = ['requested', 'confirmed', 'on_the_way', 'arrived']

const STATUS_META: Record<StatusStep, { label: string; desc: string; icon: string; color: string }> = {
  requested:  { label: 'Booking Requested',    desc: 'Your request is being processed',    icon: '📋', color: 'bg-yellow-500' },
  confirmed:  { label: 'Booking Confirmed',    desc: 'Ambulance assigned to your booking', icon: '✅', color: 'bg-blue-500' },
  on_the_way: { label: 'Ambulance On The Way', desc: 'Driver is heading to your location', icon: '🚑', color: 'bg-orange-500' },
  arrived:    { label: 'Ambulance Arrived',    desc: 'Ambulance has reached your location', icon: '📍', color: 'bg-green-500' },
}

interface Props {
  booking: AmbulanceBooking
}

export default function AmbulanceStatusClient({ booking }: Props) {
  const initialStep = STATUS_STEPS.indexOf(booking.status as StatusStep)
  const [currentStep, setCurrentStep] = useState(Math.max(initialStep, 0))

  // Simulate progression only if not already at a terminal state
  useEffect(() => {
    if (booking.status === 'arrived' || booking.status === 'completed' || booking.status === 'cancelled') return

    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setCurrentStep((s) => Math.max(s, 1)), 15_000))   // confirmed
    timers.push(setTimeout(() => setCurrentStep((s) => Math.max(s, 2)), 45_000))   // on_the_way
    timers.push(setTimeout(() => setCurrentStep((s) => Math.max(s, 3)), 600_000))  // arrived

    return () => timers.forEach(clearTimeout)
  }, [booking.status])

  const currentStatus = STATUS_STEPS[currentStep]
  const meta = STATUS_META[currentStatus]

  return (
    <div>
      {/* Status banner */}
      <div className={`${meta.color} text-white rounded-2xl p-6 mb-6 text-center`}>
        <div className="text-4xl mb-2">{meta.icon}</div>
        <h1 className="text-xl font-bold mb-1">{meta.label}</h1>
        <p className="text-white/85 text-sm">{meta.desc}</p>
        {booking.estimated_minutes !== null && currentStep < 3 && (
          <div className="flex items-center justify-center gap-1.5 mt-3 bg-white/20 rounded-full px-4 py-1.5 w-fit mx-auto">
            <Clock size={14} />
            <span className="text-sm font-semibold">ETA: ~{booking.estimated_minutes} mins</span>
          </div>
        )}
      </div>

      {/* Progress steps */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="relative">
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200" />
          <div
            className="absolute left-4 top-4 w-0.5 bg-teal-500 transition-all duration-700"
            style={{ height: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
          />
          <div className="space-y-6">
            {STATUS_STEPS.map((step, i) => {
              const isDone   = i <= currentStep
              const isActive = i === currentStep
              return (
                <div key={step} className="flex items-start gap-4 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${isDone ? 'bg-teal-500' : 'bg-gray-200'}`}>
                    {isDone
                      ? <CheckCircle size={16} className="text-white" />
                      : <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                    }
                  </div>
                  <div className={`pt-1 ${isActive ? 'opacity-100' : isDone ? 'opacity-70' : 'opacity-40'}`}>
                    <p className={`text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                      {STATUS_META[step].label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-gray-500 mt-0.5">{STATUS_META[step].desc}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Booking details */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Booking details</p>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm">
          <div>
            <p className="text-xs text-gray-400">Pickup</p>
            <p className="font-medium text-gray-900 mt-0.5">{booking.pickup_address}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Destination</p>
            <p className="font-medium text-gray-900 mt-0.5">{booking.destination_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Patient</p>
            <p className="font-medium text-gray-900 mt-0.5">{booking.patient_name}</p>
          </div>
        </div>
      </div>

      {/* Driver info — shown after confirmed */}
      {currentStep >= 1 && booking.ambulance && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Your driver</p>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{booking.ambulance.driver_name}</p>
              <p className="text-sm text-gray-500">{booking.ambulance.vehicle_number}</p>
            </div>
            <a
              href={`tel:${booking.ambulance.driver_phone}`}
              className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors shrink-0"
            >
              <Phone size={14} />Call driver
            </a>
          </div>
        </div>
      )}

      <Link href="/ambulance" className="block text-center text-sm text-gray-500 hover:text-teal-600 transition-colors">
        Book another ambulance
      </Link>
    </div>
  )
}