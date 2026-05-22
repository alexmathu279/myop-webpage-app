/**
 * app/(public)/pharmacy/page.tsx
 * Server Component — fetches all products, passes to client for filtering/cart.
 */

import type { Metadata } from 'next'
import { cachedGetProducts } from '@/lib/pharmacy/products'
import PharmacyClient from './_components/PharmacyClient'

export const metadata: Metadata = {
  title:       'Pharmacy — Medicines & Wellness',
  description: 'Order medicines, health devices and wellness products online.',
}

export default async function PharmacyPage() {
  const products = await cachedGetProducts('all')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Pharmacy</h1>
        <p className="text-gray-500">Medicines, wellness products and health devices delivered to your door.</p>
      </div>
      <PharmacyClient initialProducts={products} />
    </div>
  )
}