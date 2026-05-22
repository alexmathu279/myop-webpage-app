import { PHARMACY } from '@/lib/config'

export interface CartItem {
  product_id: string
  name: string
  slug: string
  image_url: string | null
  price: number
  mrp: number
  unit: string
  requires_prescription: boolean
  quantity: number
}

export type Cart = CartItem[]

const STORAGE_KEY = 'myop-cart'

export function getCart(): Cart {
  if (typeof window === 'undefined') return []

  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]'
    )
  } catch {
    return []
  }
}

export function saveCart(cart: Cart) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(cart)
  )
}

export function clearCart() {
  localStorage.removeItem(STORAGE_KEY)
}

export function addToCart(
  cart: Cart,
  item: Omit<CartItem,'quantity'>,
  qty=1
): Cart {

  const existing = cart.find(
    i => i.product_id===item.product_id
  )

  if(existing){

    return cart.map(i=>
      i.product_id===item.product_id
      ? {
          ...i,
          quantity: Math.min(
            i.quantity+qty,
            PHARMACY.CART_MAX_QTY
          )
        }
      : i
    )
  }

  return [
    ...cart,
    {
      ...item,
      quantity: qty
    }
  ]
}

export function updateQty(
  cart: Cart,
  productId:string,
  qty:number
):Cart{

  return cart.map(i=>
    i.product_id===productId
      ? {
          ...i,
          quantity:Math.min(
            qty,
            PHARMACY.CART_MAX_QTY
          )
        }
      : i
  )
}

export function removeFromCart(
  cart:Cart,
  productId:string
){

 return cart.filter(
   i=>i.product_id!==productId
 )
}

export function cartTotal(
 cart:Cart
){
 return cart.reduce(
   (sum,i)=>
   sum+(i.price*i.quantity),
   0
 )
}

export function cartCount(
 cart:Cart
){
 return cart.reduce(
   (sum,i)=>
   sum+i.quantity,
   0
 )
}

export function hasPrescriptionItems(
 cart:Cart
){
 return cart.some(
   i=>i.requires_prescription
 )
}

export function mergeCart(
 localCart:Cart,
 dbItems:{
   product_id:string
   quantity:number
 }[]
):Cart{

 return localCart.map(item=>{

   const db=dbItems.find(
    d=>d.product_id===item.product_id
   )

   if(!db) return item

   return{
    ...item,
    quantity:Math.min(
      item.quantity+db.quantity,
      PHARMACY.CART_MAX_QTY
    )
   }

 })

}