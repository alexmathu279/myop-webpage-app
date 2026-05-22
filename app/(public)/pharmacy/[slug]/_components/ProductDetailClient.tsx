'use client'

/**
 * app/(public)/pharmacy/[slug]/_components/ProductDetailClient.tsx
 */

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ShoppingCart, Plus, Minus, FileText, Truck, Shield } from 'lucide-react'
import { useCart } from '@/lib/pharmacy/context'
import type { ProductDetail } from '@/lib/pharmacy/products'

interface Props { product: ProductDetail }

export default function ProductDetailClient({ product }: Props) {
  const { cart, add, update } = useCart()
  const cartItem = cart.find((c) => c.product_id === product.id)
  const [qty, setQty] = useState(1)
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100)
  const outOfStock = product.stock === 0

  function handleAdd() {
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
    }, qty)
  }

  return (
    <div>
      <Link href="/pharmacy" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-teal-600 transition-colors mb-6">
        <ChevronLeft size={16} />Back to pharmacy
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="bg-gray-50 rounded-2xl aspect-square flex items-center justify-center p-8 relative">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image_url} alt={product.name} className="w-full h-full object-contain" />
          ) : (
            <div className="text-7xl select-none">
              {product.category === 'medicine' ? '💊' : product.category === 'wellness' ? '✨' : product.category === 'mother_care' ? '🤱' : product.category === 'baby_care' ? '👶' : '🩻'}
            </div>
          )}
          {discount > 0 && (
            <span className="absolute top-4 left-4 bg-green-500 text-white text-sm font-bold px-2 py-1 rounded-lg">
              {discount}% off
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          {product.brand && <p className="text-sm text-teal-600 font-semibold">{product.brand}</p>}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
          <p className="text-sm text-gray-500">{product.unit}</p>

          {product.requires_prescription && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
              <FileText size={14} />
              <span>Prescription required — you can upload it at checkout.</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-gray-900">₹{product.price}</span>
            {product.mrp > product.price && (
              <span className="text-lg text-gray-400 line-through">₹{product.mrp}</span>
            )}
          </div>

          {/* Qty picker + Add */}
          {!outOfStock ? (
            <div className="flex items-center gap-3">
              {!cartItem ? (
                <>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-100 transition-colors">
                      <Minus size={14} />
                    </button>
                    <span className="px-4 py-2 text-sm font-semibold min-w-[3rem] text-center">{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(10, q + 1))} className="px-3 py-2 hover:bg-gray-100 transition-colors">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={handleAdd} className="flex items-center gap-2 h-10 px-6 bg-teal-600 text-white rounded-lg font-semibold text-sm hover:bg-teal-700 transition-colors flex-1 justify-center">
                    <ShoppingCart size={16} />Add to cart
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-teal-300 rounded-lg overflow-hidden bg-teal-50">
                    <button onClick={() => update(product.id, cartItem.quantity - 1)} className="px-3 py-2 hover:bg-teal-100 transition-colors text-teal-700">
                      <Minus size={14} />
                    </button>
                    <span className="px-4 py-2 text-sm font-semibold text-teal-700 min-w-[3rem] text-center">{cartItem.quantity}</span>
                    <button onClick={() => update(product.id, cartItem.quantity + 1)} className="px-3 py-2 hover:bg-teal-100 transition-colors text-teal-700">
                      <Plus size={14} />
                    </button>
                  </div>
                  <Link href="/pharmacy/cart" className="h-10 px-6 bg-teal-600 text-white rounded-lg font-semibold text-sm hover:bg-teal-700 transition-colors flex items-center">
                    Go to cart →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-500 font-semibold">Out of stock</p>
          )}

          {/* Delivery info */}
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Truck size={14} className="text-teal-500 shrink-0" />
              Free delivery on orders above ₹500
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield size={14} className="text-teal-500 shrink-0" />
              100% genuine products
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-2">About this product</p>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}