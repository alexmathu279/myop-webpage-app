'use client'

/**
 * lib/pharmacy/context.tsx
 * MYOP Healthcare Marketplace — Pharmacy Cart Context
 *
 * Single source of truth for cart state.
 * No competing implementations — this is the only cart context.
 *
 * On mount: loads from localStorage (guest or previously saved)
 * On login detected: calls syncCartToDb() + getDbCart() to merge carts
 *
 * The context uses lib/pharmacy/cart.ts pure functions for all operations.
 * DB sync functions are in lib/pharmacy/actions.ts (server actions).
 */

import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react'
import {
  type Cart, type CartItem,
  getCart, saveCart, clearCart,
  addToCart, updateQty, removeFromCart,
  cartTotal, cartCount, hasPrescriptionItems, mergeCart,
} from './cart'
import { syncCartToDb, getDbCart } from './actions'

// =============================================================================
// CONTEXT SHAPE
// =============================================================================

interface CartContextValue {
  cart:            Cart
  count:           number
  total:           number
  hasPrescription: boolean
  add:    (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  update: (productId: string, qty: number) => void
  remove: (productId: string) => void
  clear:  () => void
  /** Call once after login to merge guest cart with DB cart */
  syncAfterLogin: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

// =============================================================================
// PROVIDER
// =============================================================================

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart,  setCart]  = useState<Cart>([])
  const [ready, setReady] = useState(false)

  // ── Load from localStorage on mount ──
  useEffect(() => {
    setCart(getCart())
    setReady(true)
  }, [])

  // ── Persist to localStorage on every change ──
  useEffect(() => {
    if (ready) saveCart(cart)
  }, [cart, ready])

  // ── Cart operations ──
  const add = useCallback((item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setCart((prev) => addToCart(prev, item, qty))
  }, [])

  const update = useCallback((productId: string, qty: number) => {
    setCart((prev) => updateQty(prev, productId, qty))
  }, [])

  const remove = useCallback((productId: string) => {
    setCart((prev) => removeFromCart(prev, productId))
  }, [])

  const clear = useCallback(() => {
    setCart([])
    clearCart()
  }, [])

  // ── Sync after login ──
  // Called once from the patient dashboard or auth callback.
  // Steps:
  //   1. Get DB cart items (product_id + quantity only)
  //   2. Merge with current localStorage cart (guest cart takes product info)
  //   3. Sync merged cart back to DB
  //   4. localStorage now reflects the merged state
  const syncAfterLogin = useCallback(async () => {
    const currentCart = getCart()  // latest localStorage state

    // Push current cart to DB first
    if (currentCart.length > 0) {
      await syncCartToDb(
        currentCart.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
      )
    }

    // Fetch DB cart (may have items from previous sessions on other devices)
    const dbItems = await getDbCart()

    if (dbItems.length === 0) return  // nothing to merge

    // Merge — guest cart product info + max of both quantities
    const merged = mergeCart(currentCart, dbItems)
    setCart(merged)
    saveCart(merged)
  }, [])

  return (
    <CartContext.Provider value={{
      cart,
      count:           cartCount(cart),
      total:           cartTotal(cart),
      hasPrescription: hasPrescriptionItems(cart),
      add, update, remove, clear, syncAfterLogin,
    }}>
      {children}
    </CartContext.Provider>
  )
}

// =============================================================================
// HOOK
// =============================================================================

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}