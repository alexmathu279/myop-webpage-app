/**
 * app/(public)/hospitals/[slug]/page.tsx
 * Hospital detail page — public, no auth required.
 *
 * Shows:
 *   - Hospital header (logo, name, address, contact)
 *   - Department filter tabs
 *   - Doctors grid (filtered by selected department)
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getHospitalBySlug, getHospitalDoctors } from '@/lib/booking/hospital'
import HospitalHeader     from './_components/HospitalHeader'
import DoctorsGrid        from './_components/DoctorsGrid'
import DepartmentFilter   from './_components/DepartmentFilter'

interface PageProps {
  params:      Promise<{ slug: string }>
  searchParams: Promise<{ dept?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const hospital = await getHospitalBySlug(slug)
  if (!hospital) return { title: 'Hospital Not Found' }
  return {
    title:       hospital.name,
    description: hospital.description ?? `Book doctor appointments at ${hospital.name}`,
  }
}

export default async function HospitalDetailPage({ params, searchParams }: PageProps) {
  const { slug }         = await params
  const { dept: deptId } = await searchParams

  // Fetch hospital + active departments
  const hospital = await getHospitalBySlug(slug)
 console.log('departments raw:', hospital)
  if (!hospital) notFound()

  // Fetch doctors — filtered by department if dept param is present
  const doctors = await getHospitalDoctors(hospital.id, deptId)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Hospital header */}
      <HospitalHeader hospital={hospital} />

      {/* Department filter + doctors grid */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-gray-900">
            Our Doctors
            {doctors.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({doctors.length})
              </span>
            )}
          </h2>
        </div>

        {/* Department filter tabs — Client Component */}
        {hospital.departments.length > 0 && (
          <DepartmentFilter
          
            departments={hospital.departments}
            activeDeptId={deptId}
          />
        )}

        {/* Doctors grid — Server Component */}
        <DoctorsGrid
          doctors={doctors}
          hospitalSlug={hospital.slug}
        />
      </section>

    </div>
  )
}