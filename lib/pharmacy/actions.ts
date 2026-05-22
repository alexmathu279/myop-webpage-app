'use server'

/**
 * lib/pharmacy/actions.ts
 * MYOP Healthcare Marketplace — Pharmacy Module
 *
 * WRITE ONLY — all INSERT/UPDATE/DELETE operations.
 * Read queries are in lib/pharmacy/products.ts
 *
 * Functions:
 *   placePharmacyOrder  — create order (COD or online)
 *   syncCartToDb        — upsert localStorage cart items to DB after login
 *   getDbCart           — fetch DB cart items for merge on login
 */

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createRazorpayOrder, rupeesToPaise } from '@/lib/payment/razorpay'
import type { CartItem } from './cart'
import type { ActionResult } from '@/types/dto'

// =============================================================================
// TYPES
// =============================================================================

export interface DeliveryAddress {
  line1:   string
  line2:   string
  city:    string
  state:   string
  pincode: string
  phone:   string
}

export interface PlaceOrderResult {
  orderId:          string
  paymentMethod:    'cod' | 'online'
  razorpayOrderId?: string
  amount?:          number
  keyId?:           string
}

// =============================================================================
// placePharmacyOrder
// =============================================================================

export async function placePharmacyOrder(params: {
  items:            CartItem[]
  deliveryAddress:  DeliveryAddress
  paymentMethod:    'cod' | 'online'
  prescriptionUrl?: string
}): Promise<ActionResult<PlaceOrderResult>> {
  // ── Auth ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Please sign in to place an order.' }

  const { items, deliveryAddress, paymentMethod, prescriptionUrl } = params

  // ── Validate cart ──
  if (!items || items.length === 0) return { success: false, error: 'Cart is empty.' }

  // ── Validate address ──
  if (!deliveryAddress.line1.trim()) return { success: false, error: 'Please enter your street address.' }
  if (!deliveryAddress.city.trim())  return { success: false, error: 'Please enter your city.' }
  if (!deliveryAddress.state.trim()) return { success: false, error: 'Please select your state.' }
  if (!/^\d{6}$/.test(deliveryAddress.pincode)) return { success: false, error: 'Please enter a valid 6-digit pincode.' }
  if (!/^[6-9]\d{9}$/.test(deliveryAddress.phone.replace(/\s/g, ''))) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number.' }
  }

  // ── Prescription validation ──
  const hasPrescription = items.some((i) => i.requires_prescription)
  // Note: prescription upload is enforced at checkout UI level.
  // We accept prescriptionUrl as optional here — staff verifies on delivery.

  // ── Calculate totals ──
  const subtotal    = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const deliveryFee = subtotal >= 500 ? 0 : 40
  const total       = subtotal + deliveryFee

  const serviceClient = createServiceClient()

  // ── Create order ──
  const { data: order, error: orderErr } = await (serviceClient as any)
    .from('pharmacy_orders')
    .insert({
      patient_id:       user.id,
      order_status:     'placed',
      payment_method:   paymentMethod,
      payment_status:   'pending',
      items:            items.map((i) => ({
        product_id: i.product_id,
        name:       i.name,
        price:      i.price,
        quantity:   i.quantity,
        image_url:  i.image_url,
        unit:       i.unit,
      })),
      total,
      delivery_fee:     deliveryFee,
      delivery_address: deliveryAddress,
      prescription_url: prescriptionUrl ?? null,
    })
    .select('id')
    .single()

  if (orderErr || !order) {
    console.error('[placePharmacyOrder]', orderErr?.message)
    return { success: false, error: 'Failed to place order. Please try again.' }
  }

  // ── COD — return immediately ──
  if (paymentMethod === 'cod') {
    return { success: true, data: { orderId: order.id, paymentMethod: 'cod' } }
  }

  // ── Online — create Razorpay order ──
  try {
    const rzpOrder = await createRazorpayOrder({
      amount:   rupeesToPaise(total),
      currency: 'INR',
      receipt:  order.id,
      notes:    { order_id: order.id, patient_id: user.id, type: 'pharmacy' },
    })

    await (serviceClient as any)
      .from('pharmacy_orders')
      .update({ razorpay_order_id: rzpOrder.id })
      .eq('id', order.id)

    return {
      success: true,
      data: {
        orderId:         order.id,
        paymentMethod:   'online',
        razorpayOrderId: rzpOrder.id,
        amount: Number(rzpOrder.amount),
        keyId:           process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      },
    }
  } catch (err) {
    console.error('[placePharmacyOrder] Razorpay error:', err)
    // Cancel the order since payment setup failed
    await (serviceClient as any)
      .from('pharmacy_orders')
      .update({ order_status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: 'Payment initiation failed' })
      .eq('id', order.id)
    return { success: false, error: 'Payment service unavailable. Please use Cash on Delivery.' }
  }
}

// =============================================================================
// syncCartToDb
// Called once after login to persist guest cart to DB.
// Uses upsert so re-calling is idempotent.
// =============================================================================

export async function syncCartToDb(
  items: { product_id: string; quantity: number }[],
): Promise<void> {
  if (items.length === 0) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Upsert each item — if exists, update quantity; if not, insert
  const rows = items.map((i) => ({
    user_id:    user.id,
    product_id: i.product_id,
    quantity:   Math.min(i.quantity, 10),
  }))

  const { error } = await (supabase as any)
    .from('cart_items')
    .upsert(rows, { onConflict: 'user_id,product_id' })

  if (error) console.error('[syncCartToDb]', error.message)
}

// =============================================================================
// getDbCart
// Fetches cart items from DB for the logged-in user.
// Used to merge with localStorage cart on login.
// Returns minimal shape — product details are in localStorage cart.
// =============================================================================

export async function getDbCart(): Promise<{ product_id: string; quantity: number }[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await (supabase as any)
    .from('cart_items')
    .select('product_id, quantity')
    .eq('user_id', user.id)

  if (error) { console.error('[getDbCart]', error.message); return [] }

  return (data ?? []).map((r: any) => ({
    product_id: r.product_id,
    quantity:   r.quantity,
  }))
} 