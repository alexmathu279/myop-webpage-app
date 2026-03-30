/**
 * app/(public)/book/clinic/[slug]/[deptId]/page.tsx
 *
 * Branches based on whether the department has doctors:
 *   - has_doctors = true  → show DoctorsList
 *   - has_doctors = false → show DatePicker for walk-in booking
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getClinicBySlug, getClinicDepartment, getClinicDoctors } from '@/lib/booking/clinic'
import DepartmentHeader from './_components/DepartmentHeader'
import DoctorsList      from './_components/DoctorsList'
import WalkInDatePicker from './_components/WalkInDatePicker'

interface PageProps {
  params: Promise<{ slug: string; deptId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, deptId } = await params
  const clinic = await getClinicBySlug(slug)
  if (!clinic) return { title: 'Not Found' }
  const dept = await getClinicDepartment(clinic.id, deptId)
  if (!dept) return { title: 'Department Not Found' }
  return { title: `${dept.name} — ${clinic.name}` }
}

export default async function ClinicDeptPage({ params }: PageProps) {
  const { slug, deptId } = await params

  const clinic = await getClinicBySlug(slug)
  if (!clinic) notFound()

  const dept = await getClinicDepartment(clinic.id, deptId)
  if (!dept) notFound()

  // Auth state for login gate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <DepartmentHeader dept={dept} clinic={clinic} />

      {dept.has_doctors ? (
        // Branch A — fetch and show doctors
        <DoctorsBranch clinicId={clinic.id} deptId={deptId} clinicSlug={slug} />
      ) : (
        // Branch B — no doctors, show date picker
        <WalkInDatePicker
          clinicSlug={slug}
          deptId={deptId}
          deptName={dept.name}
          fee={dept.fee}
          isLoggedIn={isLoggedIn}
        />
      )}
    </div>
  )
}

// Separate async component so we can fetch doctors conditionally
async function DoctorsBranch({
  clinicId,
  deptId,
  clinicSlug,
}: {
  clinicId:   string
  deptId:     string
  clinicSlug: string
}) {
  const doctors = await getClinicDoctors(clinicId, deptId)

  return (
    <DoctorsList
      doctors={doctors}
      clinicSlug={clinicSlug}
      deptId={deptId}
    />
  )
}