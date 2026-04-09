/**
 * app/(public)/hospitals/[slug]/book/[doctorId]/page.tsx
 *
 * Slot picker page — public browse, login gate at slot selection.
 *
 * Layout:
 *   - Doctor header card (photo, name, fee, bio)
 *   - 7-day date strip (Client Component — interactive)
 *   - Slots grid for selected date (re-rendered via URL ?date= param)
 *   - "Select" button → redirects to /login if unauthenticated
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDoctorById, getDoctorSlots } from '@/lib/booking/hospital'
import { getHospitalBySlug } from '@/lib/booking/hospital'
import { createClient } from '@/lib/supabase/server'
import DoctorProfileCard from './_components/DoctorProfileCard'
import DateStrip        from './_components/DateStrip'
import SlotsGrid        from './_components/SlotsGrid'

interface PageProps {
  params:       Promise<{ slug: string; doctorId: string }>
  searchParams: Promise<{ date?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, doctorId } = await params
  const hospital = await getHospitalBySlug(slug)
  if (!hospital) return { title: 'Not Found' }
  const doctor = await getDoctorById(doctorId, hospital.id)
  if (!doctor) return { title: 'Doctor Not Found' }
  return {
    title:       `Book ${doctor.full_name} — ${hospital.name}`,
    description: `Available appointment slots for ${doctor.full_name}, ${doctor.specialisation} at ${hospital.name}.`,
  }
}

export default async function SlotPickerPage({ params, searchParams }: PageProps) {
  const { slug, doctorId } = await params
  const { date: rawDate }  = await searchParams

  // ── Auth state (public page — just check if logged in) ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  // ── Data fetching ──
  const hospital = await getHospitalBySlug(slug)
  if (!hospital) notFound()

  const doctor = await getDoctorById(doctorId, hospital.id)
  if (!doctor) notFound()

  // Determine selected date — default to today (server timezone-safe: use ISO date)
  const today        = getTodayISO()
  const selectedDate = isValidDateParam(rawDate) ? rawDate! : today

  // 7-day range: selectedDate through selectedDate + 6 days
  const endDate = addDays(selectedDate, 6)

  // Fetch slots for the full 7-day window — DateStrip filters client-side by day
  const slots = await getDoctorSlots(doctorId, hospital.id, selectedDate, endDate)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Doctor profile header */}
      <DoctorProfileCard
        doctor={doctor}
        hospitalName={hospital.name}
        hospitalSlug={slug}
      />

      {/* Date strip + slots */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Select a Date &amp; Time
        </h2>

        {/* 7-day strip — Client Component (updates ?date= param) */}
        <DateStrip
          startDate={today}
          selectedDate={selectedDate}
          slotsPerDay={groupSlotsByDate(slots)}
        />

        {/* Slots grid for selected date */}
        <SlotsGrid
          slots={slots.filter((s) => s.slot_start.startsWith(selectedDate))}
          selectedDate={selectedDate}
          doctorId={doctorId}
          hospitalSlug={slug}
          consultationFee={doctor.consultation_fee}
          isLoggedIn={isLoggedIn}
        />
      </div>

    </div>
  )
}

// =============================================================================
// HELPERS — pure functions, no DB calls
// =============================================================================

/** Returns today's date as 'YYYY-MM-DD' in UTC */
function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Add N days to a 'YYYY-MM-DD' string, returns 'YYYY-MM-DD' */
function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Validate that a date param is a real YYYY-MM-DD string */
function isValidDateParam(d: string | undefined): boolean {
  if (!d) return false
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d))
}

/** Group slot IDs by 'YYYY-MM-DD' prefix — used by DateStrip for dot indicators */
function groupSlotsByDate(slots: { slot_start: string }[]): Record<string, number> {
  return slots.reduce<Record<string, number>>((acc, slot) => {
    const day = slot.slot_start.slice(0, 10)
    acc[day] = (acc[day] ?? 0) + 1
    return acc
  }, {})
}