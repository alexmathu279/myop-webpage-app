'use client'

/**
 * app/(public)/pharmacy/checkout/page.tsx
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2, AlertCircle, Truck, CreditCard, Banknote } from 'lucide-react'
import { useCart } from '@/lib/pharmacy/context'
import { placePharmacyOrder } from '@/lib/pharmacy/actions'
import type { DeliveryAddress } from '@/lib/pharmacy/actions'

const INDIAN_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh']

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, total, hasPrescription, clear } = useCart()
  const deliveryFee = total >= 500 ? 0 : 40

  const [address, setAddress] = useState<DeliveryAddress>({ line1: '', line2: '', city: '', state: '', pincode: '', phone: '' })
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')
  const [prescriptionUrl] = useState<string | undefined>(undefined)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  const field = (key: keyof DeliveryAddress) => ({
    value:    address[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setAddress((prev) => ({ ...prev, [key]: e.target.value })),
  })

  const handlePlace = useCallback(async () => {
    if (cart.length === 0) return
    setPlacing(true)
    setError('')

    try {
      const result = await placePharmacyOrder({ items: cart, deliveryAddress: address, paymentMethod, prescriptionUrl })

      if (!result.success) { setError(result.error); setPlacing(false); return }

      if (result.data.paymentMethod === 'cod') {
        clear()
        router.push(`/pharmacy/orders/${result.data.orderId}`)
        return
      }

      // Online payment
      await loadRazorpayScript()
      const { orderId, razorpayOrderId, amount, keyId } = result.data
      const options = {
        key: keyId, amount, currency: 'INR',
        name: 'MYOP Pharmacy',
        description: 'Medicine order',
        order_id: razorpayOrderId,
        prefill: { contact: address.phone },
        theme: { color: '#0d9488' },
        handler: () => { clear(); router.push(`/pharmacy/orders/${orderId}`) },
        modal: { ondismiss: () => { setPlacing(false); setError('Payment cancelled.') } },
      }
      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', () => { setPlacing(false); setError('Payment failed. Please try again or use COD.') })
      rzp.open()
    } catch {
      setError('Something went wrong. Please try again.')
      setPlacing(false)
    }
  }, [cart, address, paymentMethod, prescriptionUrl, clear, router])

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
        <Link href="/pharmacy" className="text-teal-600 font-medium hover:underline mt-2 inline-block">Back to pharmacy</Link>
      </div>
    )
  }

  const canPlace = address.line1 && address.city && address.state && /^\d{6}$/.test(address.pincode) && /^[6-9]\d{9}$/.test(address.phone.replace(/\s/g, ''))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/pharmacy/cart" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-teal-600 mb-6">
        <ChevronLeft size={16} />Back to cart
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="space-y-6">
        {/* Delivery address */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Truck size={16} className="text-teal-500" />Delivery address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="co-label">Street address *</label>
              <input className="co-input" placeholder="House/flat, street, area" {...field('line1')} />
            </div>
            <div className="sm:col-span-2">
              <label className="co-label">Landmark (optional)</label>
              <input className="co-input" placeholder="Near landmark" {...field('line2')} />
            </div>
            <div>
              <label className="co-label">City *</label>
              <input className="co-input" placeholder="City" {...field('city')} />
            </div>
            <div>
              <label className="co-label">State *</label>
              <select className="co-input" {...field('state')}>
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="co-label">Pincode *</label>
              <input className="co-input" placeholder="6-digit pincode" maxLength={6} {...field('pincode')} />
            </div>
            <div>
              <label className="co-label">Mobile number *</label>
              <input className="co-input" type="tel" placeholder="10-digit number" maxLength={10} {...field('phone')} />
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><CreditCard size={16} className="text-teal-500" />Payment method</h2>
          <div className="grid grid-cols-2 gap-3">
            {([['cod', '💵', 'Cash on Delivery'], ['online', '💳', 'Pay Online']] as const).map(([val, icon, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setPaymentMethod(val)}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl text-sm font-medium transition-all ${paymentMethod === val ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-teal-300'}`}
              >
                <span className="text-2xl">{icon}</span>
                {label}
              </button>
            ))}
          </div>
          {paymentMethod === 'cod' && <p className="text-xs text-gray-400 mt-3">Pay in cash when your order arrives.</p>}
        </div>

        {hasPrescription && (
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>Your cart has prescription items. Please keep your prescription ready for the delivery agent.</p>
          </div>
        )}

        {/* Order summary */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Order total</h2>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Subtotal</span><span>₹{total.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Delivery</span>
            <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span><span>₹{(total + deliveryFee).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={14} />{error}
          </div>
        )}

        <button
          onClick={handlePlace}
          disabled={!canPlace || placing}
          className={`w-full h-12 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${canPlace && !placing ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          {placing ? <><Loader2 size={18} className="animate-spin" />Placing order…</> : `Place order · ₹${(total + deliveryFee).toLocaleString('en-IN')} →`}
        </button>
      </div>

      <style>{`
        .co-label { display: block; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
        .co-input { width: 100%; height: 40px; padding: 0 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #0f172a; outline: none; transition: border-color 0.15s; background: #fff; }
        .co-input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
      `}</style>
    </div>
  )
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve()
    s.onerror = () => reject()
    document.body.appendChild(s)
  })
}