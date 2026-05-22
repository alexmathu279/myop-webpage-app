/**
 * app/(public)/mother-child/page.tsx
 * Server Component — combined mother & child products + specialist providers.
 *
 * Import fixes:
 *   - cachedGetProducts from @/lib/pharmacy/products (not the deleted queries.ts)
 *   - CartProvider from @/lib/pharmacy/context (not the deleted cart-store.ts)
 */

import type { Metadata } from 'next'
import { cachedGetProducts } from '@/lib/pharmacy/products'
import { createServiceClient } from '@/lib/supabase/server'
import { CartProvider } from '@/lib/pharmacy/context'
import MotherChildClient from './_components/MotherChildClient'

export const metadata: Metadata = {
  title:       'Mother & Child Care',
  description: 'Products, hospitals, and specialist clinics for mother and child healthcare.',
}

// =============================================================================
// Provider query — merges admin-flagged + dept-name-matched hospitals
// =============================================================================

async function getMotherChildProviders() {
  const supabase = createServiceClient()

  const [{ data: specialists }, { data: byDept }] = await Promise.all([
    (supabase as any)
      .from('hospitals')
      .select('id, name, slug, logo_url, city, state, module, description')
      .eq('approval_status', 'approved')
      .eq('is_mother_child_specialist', true)
      .is('deleted_at', null)
      .limit(20),

    (supabase as any)
      .from('departments')
      .select('hospital_id')
      .is('deleted_at', null)
      .eq('is_active', true)
      .or('name.ilike.%paediatric%,name.ilike.%obstetric%,name.ilike.%gynaecolog%,name.ilike.%neonatolog%,name.ilike.%mother%,name.ilike.%child%'),
  ])

  const byDeptIds = new Set((byDept ?? []).map((d: any) => d.hospital_id as string))

  if (byDeptIds.size === 0) return specialists ?? []

  const { data: byDeptHospitals } = await (supabase as any)
    .from('hospitals')
    .select('id, name, slug, logo_url, city, state, module, description')
    .eq('approval_status', 'approved')
    .is('deleted_at', null)
    .in('id', Array.from(byDeptIds))
    .limit(20)

  // Deduplicate by id
  const merged = new Map<string, any>()
  for (const h of [...(specialists ?? []), ...(byDeptHospitals ?? [])]) {
    merged.set(h.id, h)
  }
  return Array.from(merged.values())
}

// =============================================================================
// PAGE
// =============================================================================

export default async function MotherChildPage() {
  const [motherProducts, babyProducts, providers] = await Promise.all([
    cachedGetProducts('mother_care'),
    cachedGetProducts('baby_care'),
    getMotherChildProviders(),
  ])

  return (
    <CartProvider>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">👶</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Mother &amp; Child Care
          </h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Everything for mother and baby — from prenatal vitamins to specialist hospitals.
          </p>
        </div>

        <MotherChildClient
          motherProducts={motherProducts}
          babyProducts={babyProducts}
          providers={providers}
        />
      </div>
    </CartProvider>
  )
}