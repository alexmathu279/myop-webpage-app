/**
 * app/(public)/book/clinic/[slug]/page.tsx
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getClinicBySlug } from '@/lib/booking/clinic'
import ClinicDetailHeader from './_components/ClinicDetailHeader'
import DepartmentsGrid    from './_components/DepartmentsGrid'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const clinic = await getClinicBySlug(slug)
  if (!clinic) return { title: 'Clinic Not Found' }
  return {
    title:       clinic.name,
    description: clinic.description ?? `Book appointments at ${clinic.name}`,
  }
}

export default async function ClinicDetailPage({ params }: PageProps) {
  const { slug } = await params
  const clinic = await getClinicBySlug(slug)
  if (!clinic) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <ClinicDetailHeader clinic={clinic} />

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-5">
          Departments
          {clinic.departments.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({clinic.departments.length})
            </span>
          )}
        </h2>
        <DepartmentsGrid departments={clinic.departments} clinicSlug={clinic.slug} />
      </section>
    </div>
  )
}