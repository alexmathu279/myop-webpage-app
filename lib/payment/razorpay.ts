import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export function rupeesToPaise(amount: number): number {
  return Math.round(amount * 100)
}

export async function createRazorpayOrder(params: {
  amount: number
  currency: string
  receipt: string
  notes?: Record<string, string>
}) {
  return razorpay.orders.create({
    amount: params.amount,
    currency: params.currency,
    receipt: params.receipt,
    notes: params.notes,
  })
}