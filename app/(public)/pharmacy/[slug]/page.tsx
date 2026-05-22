/**
 * app/(public)/pharmacy/[slug]/page.tsx
 */

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cachedGetProductBySlug } from '@/lib/pharmacy/products'
import ProductDetailClient from './_components/ProductDetailClient'

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await cachedGetProductBySlug(slug)
  if (!product) return { title: 'Product Not Found' }
  return { title: product.name, description: product.description ?? `Buy ${product.name} online` }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const product = await cachedGetProductBySlug(slug)
  if (!product) notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ProductDetailClient product={product} />
    </div>
  )
}