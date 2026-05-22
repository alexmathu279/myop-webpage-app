'use client'

/**
 * app/(public)/pharmacy/_components/PharmacyClient.tsx
 */

import { useState, useMemo } from 'react'
import { Search, X, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import ProductCard from './ProductCard'
import { useCart } from '@/lib/pharmacy/context'
import type { ProductSummary } from '@/lib/pharmacy/products'

const CATEGORIES = [
  { value: 'all',         label: 'All',          emoji: '💊' },
  { value: 'medicine',    label: 'Medicines',    emoji: '🩺' },
  { value: 'wellness',    label: 'Wellness',     emoji: '✨' },
  { value: 'mother_care', label: 'Mother Care',  emoji: '🤱' },
  { value: 'baby_care',   label: 'Baby Care',    emoji: '👶' },
  { value: 'devices',     label: 'Devices',      emoji: '🩻' },
]

interface Props {
  initialProducts: ProductSummary[]
}

export default function PharmacyClient({ initialProducts }: Props) {
  const { count } = useCart()
  const [category, setCategory] = useState('all')
  const [query,    setQuery]    = useState('')

  const filtered = useMemo(() => {
    let list = initialProducts
    if (category !== 'all') list = list.filter((p) => p.category === category)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? '').toLowerCase().includes(q) ||
        (p.subcategory ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [initialProducts, category, query])

  return (
    <div>
      {/* Top bar — search + cart */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          <input
            type="text"
            placeholder="Search medicines, brands…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-9 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        <Link href="/pharmacy/cart" className="relative flex items-center gap-2 h-10 px-4 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 transition-colors shrink-0">
          <ShoppingCart size={16} />
          Cart
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
        </Link>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
              category === cat.value
                ? 'bg-teal-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300'
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-sm text-gray-500 mb-4">
        {filtered.length} product{filtered.length !== 1 ? 's' : ''}
        {query && <> for "<span className="font-medium text-gray-700">{query}</span>"</>}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium mb-1">No products found</p>
          <p className="text-sm">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}