/**
 * app/(public)/book/diagnostic/[slug]/page.tsx
 * Public — no auth required. Login gate at checkout.
 *
 * Shows:
 *   - Centre header (name, address, contact)
 *   - Services grouped by category with cart-style multi-select
 *   - Sticky cart showing selected tests + total + proceed
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getDiagnosticCentreBySlug,
  getDiagnosticServices,
} from '@/lib/booking/diagnostic'
import CentreHeader  from './_components/CentreHeader'
import ServicesPanel from './_components/ServicesPanel'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const centre = await getDiagnosticCentreBySlug(slug)
  if (!centre) return { title: 'Centre Not Found' }
  return {
    title:       centre.name,
    description: centre.description ?? `Book lab tests at ${centre.name}`,
  }
}

export default async function DiagnosticCentreDetailPage({ params }: PageProps) {
  const { slug } = await params

  const [centre, serviceGroups] = await Promise.all([
    getDiagnosticCentreBySlug(slug),
    (async () => {
      const c = await getDiagnosticCentreBySlug(slug)
      if (!c) return []
      return getDiagnosticServices(c.id)
    })(),
  ])

  if (!centre) notFound()

  // Check auth state for login gate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <CentreHeader centre={centre} />

      <ServicesPanel
        serviceGroups={serviceGroups}
        centreSlug={slug}
        centreId={centre.id}
        isLoggedIn={isLoggedIn}
      />
    </div>
  )
}