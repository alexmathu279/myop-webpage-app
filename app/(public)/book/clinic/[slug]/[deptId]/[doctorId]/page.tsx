/**
 * app/(public)/book/clinic/[slug]/[deptId]/[doctorId]/page.tsx
 *
 * Slot picker for clinic doctors.
 * Reuses DoctorProfileCard, DateStrip, SlotsGrid from hospital module.
 * Reuses getDoctorSlots from lib/booking/hospital.ts.
 * On slot select → /book/confirm?slot=X (same hospital confirm page).
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClinicBySlug, getClinicDoctorById } from '@/lib/booking/clinic'
import { getDoctorSlots } from '@/lib/booking/hospital'
import DoctorProfileCard from '@/app/(public)/hospitals/[slug]/book/[doctorId]/_components/DoctorProfileCard'
import DateStrip         from '@/app/(public)/hospitals/[slug]/book/[doctorId]/_components/DateStrip'
import SlotsGrid         from '@/app/(public)/hospitals/[slug]/book/[doctorId]/_components/SlotsGrid'

interface PageProps {
  params:       Promise<{ slug: string; deptId: string; doctorId: string }>
  searchParams: Promise<{ date?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, deptId, doctorId } = await params
  const clinic = await getClinicBySlug(slug)
  if (!clinic) return { title: 'Not Found' }
  const doctor = await getClinicDoctorById(clinic.id, deptId, doctorId)
  if (!doctor) return { title: 'Doctor Not Found' }
  return { title: `Book ${doctor.full_name} — ${clinic.name}` }
}

export default async function ClinicSlotPickerPage({ params, searchParams }: PageProps) {
  const { slug, deptId, doctorId } = await params
  const { date: rawDate }          = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const clinic = await getClinicBySlug(slug)
  if (!clinic) notFound()

  const doctor = await getClinicDoctorById(clinic.id, deptId, doctorId)
  if (!doctor) notFound()

  const today        = new Date().toISOString().slice(0, 10)
  const selectedDate = isValidDate(rawDate) ? rawDate! : today
  const endDate      = addDays(selectedDate, 6)

  const slots = await getDoctorSlots(doctorId, clinic.id, selectedDate, endDate)

  // DoctorProfileCard expects the hospital module's DoctorDetail shape
  // ClinicDoctorDetail is compatible — same fields
  const doctorForCard = {
    ...doctor,
    hospital_id: clinic.id,
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <DoctorProfileCard
        doctor={doctorForCard}
        hospitalName={clinic.name}
        hospitalSlug={slug}
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Select a Date &amp; Time</h2>

        <DateStrip
          startDate={today}
          selectedDate={selectedDate}
          slotsPerDay={groupSlotsByDate(slots)}
        />

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

function isValidDate(d: string | undefined): boolean {
  if (!d) return false
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d))
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function groupSlotsByDate(slots: { slot_start: string }[]): Record<string, number> {
  return slots.reduce<Record<string, number>>((acc, slot) => {
    const day = slot.slot_start.slice(0, 10)
    acc[day] = (acc[day] ?? 0) + 1
    return acc
  }, {})
}