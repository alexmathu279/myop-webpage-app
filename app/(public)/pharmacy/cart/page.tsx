'use client'

/**
 * app/(public)/pharmacy/cart/page.tsx
 */

import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag, ChevronLeft, FileText } from 'lucide-react'
import { useCart } from '@/lib/pharmacy/context'

export default function CartPage() {
  const { cart, count, total, hasPrescription, update, remove } = useCart()
  const deliveryFee = total >= 500 ? 0 : 40

  if (count === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Add medicines and wellness products to get started.</p>
        <Link href="/pharmacy" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors">
          <ShoppingBag size={18} />Browse pharmacy
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/pharmacy" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-teal-600 transition-colors mb-6">
        <ChevronLeft size={16} />Continue shopping
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Your cart <span className="text-gray-400 font-normal text-lg">({count} items)</span>
      </h1>

      {hasPrescription && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl mb-6 text-sm text-orange-800">
          <FileText size={16} className="shrink-0 mt-0.5 text-orange-600" />
          <p>Some items require a prescription. You can upload it on the checkout page.</p>
        </div>
      )}

      {/* Items */}
      <div className="space-y-3 mb-6">
        {cart.map((item) => (
          <div key={item.product_id} className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4">
            {/* Image */}
            <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-2xl">💊</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link href={`/pharmacy/${item.slug}`}>
                <p className="font-semibold text-gray-900 text-sm truncate hover:text-teal-600 transition-colors">{item.name}</p>
              </Link>
              <p className="text-xs text-gray-400 mt-0.5">{item.unit}</p>
              <p className="text-sm font-bold text-gray-900 mt-1">₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
            </div>

            {/* Qty controls */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
              <button onClick={() => update(item.product_id, item.quantity - 1)} className="px-2.5 py-1.5 hover:bg-gray-100 transition-colors">
                <Minus size={12} />
              </button>
              <span className="px-3 py-1.5 text-sm font-semibold min-w-[2rem] text-center">{item.quantity}</span>
              <button onClick={() => update(item.product_id, item.quantity + 1)} className="px-2.5 py-1.5 hover:bg-gray-100 transition-colors">
                <Plus size={12} />
              </button>
            </div>

            {/* Remove */}
            <button onClick={() => remove(item.product_id)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4">Order summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal ({count} items)</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Delivery fee</span>
            <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
              {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </span>
          </div>
          {deliveryFee > 0 && (
            <p className="text-xs text-gray-400">Add ₹{500 - total} more for free delivery</p>
          )}
          <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>₹{(total + deliveryFee).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <Link href="/pharmacy/checkout" className="block w-full h-12 bg-teal-600 text-white rounded-xl font-bold text-base text-center leading-[3rem] hover:bg-teal-700 transition-colors">
        Proceed to checkout →
      </Link>
    </div>
  )
}