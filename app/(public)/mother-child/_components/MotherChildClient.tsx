'use client'

/**
 * app/(public)/mother-child/_components/MotherChildClient.tsx
 *
 * Two sections:
 *   A. Products — mother_care + baby_care from pharmacy
 *   B. Providers — hospitals/clinics specialising in mother & child care
 *
 * Products link to /pharmacy/[slug]
 * Providers link to their module detail page (/hospitals/[slug] or /book/clinic/[slug])
 */

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingCart, MapPin, Stethoscope, FileText } from 'lucide-react'
import { useCart } from '@/lib/pharmacy/context'
import type { ProductSummary } from '@/lib/pharmacy/products'

interface Provider {
  id:          string
  name:        string
  slug:        string
  logo_url:    string | null
  city:        string
  state:       string
  module:      string
  description: string | null
}

interface Props {
  motherProducts: ProductSummary[]
  babyProducts:   ProductSummary[]
  providers:      Provider[]
}

type ProductTab = 'mother' | 'baby'

export default function MotherChildClient({ motherProducts, babyProducts, providers }: Props) {
  const { add, cart } = useCart()
  const [productTab, setProductTab] = useState<ProductTab>('mother')

  const products = productTab === 'mother' ? motherProducts : babyProducts

  function providerHref(provider: Provider): string {
    if (provider.module === 'hospital')   return `/hospitals/${provider.slug}`
    if (provider.module === 'clinic')     return `/book/clinic/${provider.slug}`
    if (provider.module === 'diagnostic') return `/book/diagnostic/${provider.slug}`
    return `/hospitals/${provider.slug}`
  }

  return (
    <div className="space-y-12">

      {/* ── SECTION A: Products ── */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Products</h2>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-5">
          {([['mother', '🤱', 'Mother Care'], ['baby', '👶', 'Baby Care']] as const).map(([tab, emoji, label]) => (
            <button
              key={tab}
              onClick={() => setProductTab(tab)}
              className={`flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-medium transition-all ${
                productTab === tab
                  ? 'bg-teal-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300'
              }`}
            >
              {emoji} {label}
            </button>
          ))}
        </div>

        {products.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => {
              const inCart  = cart.some((c) => c.product_id === product.id)
              const discount = product.mrp > product.price
                ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                : 0

              return (
                <Link key={product.id} href={`/pharmacy/${product.slug}`} className="group block">
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                    <div className="relative bg-gray-50 aspect-square flex items-center justify-center p-4">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-4xl">{productTab === 'mother' ? '🤱' : '👶'}</span>
                      )}
                      {discount > 0 && (
                        <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                          {discount}% off
                        </span>
                      )}
                      {product.requires_prescription && (
                        <span className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-xs font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <FileText size={10} />Rx
                        </span>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-1 flex-1">
                      {product.brand && <p className="text-xs text-gray-400 truncate">{product.brand}</p>}
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-teal-600">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400">{product.unit}</p>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <div>
                          <span className="text-base font-bold text-gray-900">₹{product.price}</span>
                          {product.mrp > product.price && (
                            <span className="text-xs text-gray-400 line-through ml-1">₹{product.mrp}</span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            if (product.stock === 0) return
                            add({
                              product_id:            product.id,
                              name:                  product.name,
                              slug:                  product.slug,
                              image_url:             product.image_url,
                              price:                 product.price,
                              mrp:                   product.mrp,
                              unit:                  product.unit,
                              requires_prescription: product.requires_prescription,
                            })
                          }}
                          disabled={product.stock === 0}
                          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                            product.stock === 0
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : inCart
                                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                                : 'bg-teal-600 text-white hover:bg-teal-700'
                          }`}
                        >
                          <ShoppingCart size={12} />
                          {product.stock === 0 ? 'Out' : inCart ? 'Added' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── SECTION B: Healthcare Providers ── */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Specialist Healthcare Providers</h2>
        <p className="text-sm text-gray-500 mb-5">
          Hospitals, clinics, and diagnostic centres specialising in mother and child care.
        </p>

        {providers.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No specialist providers found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <Link
                key={provider.id}
                href={providerHref(provider)}
                className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-xl">
                    {provider.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={provider.logo_url} alt={provider.name} className="w-full h-full object-contain rounded-xl" />
                    ) : (
                      provider.module === 'clinic' ? '🏥' : provider.module === 'diagnostic' ? '🧪' : '🏨'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {provider.name}
                    </p>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium capitalize">
                      {provider.module}
                    </span>
                  </div>
                </div>

                {provider.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{provider.description}</p>
                )}

                <div className="flex items-center gap-1 text-xs text-gray-400 mt-auto">
                  <MapPin size={12} />
                  {provider.city}, {provider.state}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}