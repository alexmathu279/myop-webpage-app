import { CartProvider } from '@/lib/pharmacy/context'
import type { ReactNode } from 'react'

export default function PharmacyLayout({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>
}