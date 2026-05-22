'use client'

/**
 * app/(public)/pharmacy/_components/ProductCard.tsx
 */

import Link from 'next/link'
import { ShoppingCart, FileText } from 'lucide-react'
import { useCart } from '@/lib/pharmacy/context'
import type { ProductSummary } from '@/lib/pharmacy/products'

interface Props { product: ProductSummary }

export default function ProductCard({ product }: Props) {
  const { cart, add } = useCart()
  const inCart = cart.some((c) => c.product_id === product.id)
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100)
  const outOfStock = product.stock === 0

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (outOfStock) return
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
  }

  return (
    <Link href={`/pharmacy/${product.slug}`} className="group block">
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
        {/* Image */}
        <div className="relative bg-gray-50 aspect-square flex items-center justify-center p-4">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
          ) : (
            <div className="text-4xl select-none">
              {product.category === 'medicine' ? '💊' : product.category === 'wellness' ? '✨' : product.category === 'mother_care' ? '🤱' : product.category === 'baby_care' ? '👶' : '🩻'}
            </div>
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

        {/* Info */}
        <div className="p-3 flex flex-col gap-1 flex-1">
          {product.brand && (
            <p className="text-xs text-gray-400 font-medium truncate">{product.brand}</p>
          )}
          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-teal-600 transition-colors">
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
              onClick={handleAdd}
              disabled={outOfStock}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                outOfStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : inCart
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
              }`}
            >
              <ShoppingCart size={12} />
              {outOfStock ? 'Out' : inCart ? 'Added' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}