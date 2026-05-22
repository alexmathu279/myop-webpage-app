/**
 * app/(public)/pharmacy/orders/[id]/page.tsx
 * Server component — order confirmation.
 */

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, Truck, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

interface PageProps { params: Promise<{ id: string }> }

export default async function PharmacyOrderPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirectTo=/pharmacy/orders/${id}`)

  const { data: order, error } = await (supabase as any)
    .from('pharmacy_orders')
    .select('id, items, total, delivery_fee, delivery_address, payment_method, payment_status, order_status, created_at')
    .eq('id', id)
    .eq('patient_id', user.id)
    .single()

  if (error || !order) notFound()

  const address = order.delivery_address as Record<string, string>
  const items   = order.items as Array<{ name: string; price: number; quantity: number; image_url?: string; unit: string }>

  const STATUS_STEPS = ['placed', 'confirmed', 'packed', 'shipped', 'delivered']
  const currentStep  = STATUS_STEPS.indexOf(order.order_status)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Success banner */}
      <div className="bg-teal-600 rounded-2xl p-6 text-white mb-6 flex items-start gap-4">
        <CheckCircle size={32} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-lg">Order placed successfully!</p>
          <p className="text-teal-100 text-sm mt-1">
            {order.payment_method === 'cod'
              ? 'Your order has been placed. Pay cash on delivery.'
              : 'Payment received. Your order is confirmed.'}
          </p>
          <p className="text-teal-200 text-xs mt-2">Order ID: {id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Order status stepper */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Package size={16} className="text-teal-500" />Order status</h2>
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, i) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${i <= currentStep ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {i <= currentStep ? '✓' : i + 1}
              </div>
              <span className={`text-xs capitalize text-center ${i <= currentStep ? 'text-teal-600 font-semibold' : 'text-gray-400'}`}>{step}</span>
              {i < STATUS_STEPS.length - 1 && (
                <div className="absolute" style={{ display: 'none' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">Items ({items.length})</h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 text-lg">
                {item.image_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                  : '💊'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-400">{item.unit} × {item.quantity}</p>
              </div>
              <p className="text-sm font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between font-bold text-gray-900">
          <span>Total paid</span>
          <span>₹{Number(order.total).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Delivery address */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><MapPin size={16} className="text-teal-500" />Deliver to</h2>
        <p className="text-sm text-gray-700">{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
        <p className="text-sm text-gray-700">{address.city}, {address.state} — {address.pincode}</p>
        <p className="text-sm text-gray-500 mt-1">📞 {address.phone}</p>
      </div>

      <Link href="/pharmacy" className="block w-full h-11 bg-teal-600 text-white rounded-xl font-semibold text-center leading-[2.75rem] hover:bg-teal-700 transition-colors">
        Continue shopping →
      </Link>
    </div>
  )
}