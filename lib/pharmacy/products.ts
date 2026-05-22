/**
 * lib/pharmacy/products.ts
 * MYOP Healthcare Marketplace — Pharmacy Module
 *
 * READ ONLY — server-side product queries.
 * Write operations are in lib/pharmacy/actions.ts
 *
 * Uses createServiceClient() — safe inside unstable_cache (no cookies).
 *
 * Category values MUST match DB exactly:
 *   'medicine' | 'wellness' | 'mother_care' | 'baby_care' | 'devices'
 */

import { unstable_cache }   from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

// =============================================================================
// TYPES — field names match DB column names exactly (migration_008)
// =============================================================================

export interface ProductSummary {
  id:                    string
  name:                  string
  slug:                  string
  brand:                 string | null
  category:              string
  subcategory:           string | null
  image_url:             string | null
  price:                 number
  mrp:                   number
  unit:                  string
  stock:                 number
  requires_prescription: boolean   // ← matches DB column
}

export interface ProductDetail extends ProductSummary {
  description: string | null
  tags:        string[] | null
}

// Category values must match what is stored in the DB
export type PharmacyCategory =
  | 'all'
  | 'medicine'
  | 'wellness'
  | 'mother_care'   // ← DB value (not 'mother-child')
  | 'baby_care'     // ← DB value (not 'child')
  | 'devices'

export const CATEGORY_LABELS: Record<PharmacyCategory, string> = {
  all:         'All Products',
  medicine:    'Medicines',
  wellness:    'Wellness',
  mother_care: 'Mother Care',
  baby_care:   'Baby Care',
  devices:     'Devices',
}

// =============================================================================
// QUERIES
// =============================================================================

export const cachedGetProducts = unstable_cache(
  async (
    category: PharmacyCategory = 'all',
    query                       = '',
  ): Promise<ProductSummary[]> => {
    const supabase = createServiceClient()

    let q = (supabase as any)
      .from('products')
      .select('id, name, slug, brand, category, subcategory, image_url, price, mrp, unit, stock, requires_prescription')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (category !== 'all') q = q.eq('category', category)

    if (query.trim()) {
      const pattern = `%${query.trim()}%`
      q = q.or(`name.ilike.${pattern},brand.ilike.${pattern},subcategory.ilike.${pattern}`)
    }

    const { data, error } = await q.limit(60)
    if (error) { console.error('[cachedGetProducts]', error.message); return [] }
    return data ?? []
  },
  ['pharmacy-products'],
  { revalidate: 120, tags: ['products'] },
)

export const cachedGetProductBySlug = unstable_cache(
  async (slug: string): Promise<ProductDetail | null> => {
    const supabase = createServiceClient()

    const { data, error } = await (supabase as any)
      .from('products')
      .select('id, name, slug, brand, category, subcategory, image_url, price, mrp, unit, stock, requires_prescription, description, tags')
      .eq('slug', slug)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    if (error || !data) ret urn null
    return data
  },
  ['product-by-slug'],
  { revalidate: 120, tags: ['products'] },
)