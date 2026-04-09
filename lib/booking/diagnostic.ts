/**
 * lib/booking/diagnostic.ts
 * MYOP Healthcare Marketplace
 *
 * Patient-facing READ queries for the diagnostic booking module.
 *
 * Rules enforced here:
 *   - Every centres query includes .eq('module', 'diagnostic')
 *   - Every centres query includes approval_status = 'approved'
 *   - Every services query includes .eq('hospital_id', centreId)
 *   - No raw DB rows returned — clean mapped shapes only
 *   - No await createClient() at module level
 *   - No writes in this file
 */

import { createClient } from '@/lib/supabase/server'

// =============================================================================
// RETURN TYPES
// =============================================================================

export interface DiagnosticCentreSearchResult {
  id:            string
  name:          string
  slug:          string
  logo_url:      string | null
  city:          string
  state:         string
  address_line1: string
  phone:         string
  description:   string | null
  services_count: number
}

export interface DiagnosticCentreDetail {
  id:            string
  name:          string
  slug:          string
  logo_url:      string | null
  description:   string | null
  city:          string
  state:         string
  pincode:       string
  address_line1: string
  address_line2: string | null
  phone:         string
  email:         string
  website:       string | null
}

export interface DiagnosticService {
  id:                 string
  name:               string
  description:        string | null
  code:               string | null
  category:           string | null
  price:              number
  duration_mins:      number | null
  preparation:        string | null
  report_tat_hrs:     number | null
  is_home_collection: boolean
}

/** Services grouped by category */
export interface DiagnosticServiceGroup {
  category:  string
  services:  DiagnosticService[]
}

// =============================================================================
// 1. SEARCH DIAGNOSTIC CENTRES
//    2-step search: name match + service name match → merge IDs
//    Empty query → all approved centres
// =============================================================================

export async function searchDiagnosticCentres(
  query: string,
): Promise<DiagnosticCentreSearchResult[]> {
  const supabase = await createClient()
  const q = query.trim()

  if (!q) {
    const { data, error } = await supabase
      .from('hospitals')
      .select('id, name, slug, logo_url, city, state, address_line1, phone, description')
      .eq('module', 'diagnostic')
      .eq('approval_status', 'approved')
      .is('deleted_at', null)
      .order('name', { ascending: true })
      .limit(50)

    if (error) {
      console.error('[searchDiagnosticCentres] list error:', error.message)
      return []
    }
    if (!data || data.length === 0) return []

    // Fetch service counts
    const centreIds = data.map((c) => c.id)
    const { data: serviceRows } = await supabase
      .from('services')
      .select('hospital_id')
      .eq('module', 'diagnostic')
      .eq('is_active', true)
      .is('deleted_at', null)
      .in('hospital_id', centreIds)

    const countMap: Record<string, number> = {}
    for (const s of serviceRows ?? []) {
      countMap[s.hospital_id] = (countMap[s.hospital_id] ?? 0) + 1
    }

    return data.map((c) => ({
      id:             c.id,
      name:           c.name,
      slug:           c.slug,
      logo_url:       c.logo_url,
      city:           c.city,
      state:          c.state,
      address_line1:  c.address_line1,
      phone:          c.phone,
      description:    c.description,
      services_count: countMap[c.id] ?? 0,
    }))
  }

  // With query — 2-step search
  const pattern = `%${q}%`

  const [
    { data: byName },
    { data: byService },
  ] = await Promise.all([
    supabase
      .from('hospitals')
      .select('id')
      .eq('module', 'diagnostic')
      .eq('approval_status', 'approved')
      .is('deleted_at', null)
      .ilike('name', pattern),
    supabase
      .from('services')
      .select('hospital_id')
      .eq('module', 'diagnostic')
      .eq('is_active', true)
      .is('deleted_at', null)
      .or(`name.ilike.${pattern},category.ilike.${pattern}`),
  ])

  const idSet = new Set<string>([
    ...(byName    ?? []).map((c) => c.id),
    ...(byService ?? []).map((s) => s.hospital_id),
  ])

  if (idSet.size === 0) return []

  const ids = Array.from(idSet)

  const { data: matched, error: matchErr } = await supabase
    .from('hospitals')
    .select('id, name, slug, logo_url, city, state, address_line1, phone, description')
    .eq('module', 'diagnostic')
    .eq('approval_status', 'approved')
    .is('deleted_at', null)
    .in('id', ids)
    .order('name', { ascending: true })

  if (matchErr || !matched) return []

  const { data: serviceRows2 } = await supabase
    .from('services')
    .select('hospital_id')
    .eq('module', 'diagnostic')
    .eq('is_active', true)
    .is('deleted_at', null)
    .in('hospital_id', ids)

  const countMap2: Record<string, number> = {}
  for (const s of serviceRows2 ?? []) {
    countMap2[s.hospital_id] = (countMap2[s.hospital_id] ?? 0) + 1
  }

  return matched.map((c) => ({
    id:             c.id,
    name:           c.name,
    slug:           c.slug,
    logo_url:       c.logo_url,
    city:           c.city,
    state:          c.state,
    address_line1:  c.address_line1,
    phone:          c.phone,
    description:    c.description,
    services_count: countMap2[c.id] ?? 0,
  }))
}

// =============================================================================
// 2. GET DIAGNOSTIC CENTRE BY SLUG
// =============================================================================

export async function getDiagnosticCentreBySlug(
  slug: string,
): Promise<DiagnosticCentreDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hospitals')
    .select(`
      id, name, slug, logo_url, description,
      city, state, pincode, address_line1, address_line2,
      phone, email, website
    `)
    .eq('module', 'diagnostic')
    .eq('approval_status', 'approved')
    .is('deleted_at', null)
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[getDiagnosticCentreBySlug] error:', error.message)
    }
    return null
  }
  if (!data) return null

  return {
    id:            data.id,
    name:          data.name,
    slug:          data.slug,
    logo_url:      data.logo_url,
    description:   data.description,
    city:          data.city,
    state:         data.state,
    pincode:       data.pincode,
    address_line1: data.address_line1,
    address_line2: data.address_line2,
    phone:         data.phone,
    email:         data.email,
    website:       data.website,
  }
}

// =============================================================================
// 3. GET DIAGNOSTIC CENTRE SERVICES — grouped by category
//    Returns services for a centre, grouped for display.
//    Uncategorised services go under 'Other'.
// =============================================================================

export async function getDiagnosticServices(
  centreId: string,
): Promise<DiagnosticServiceGroup[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select(`
      id, name, description, code, category, price,
      duration_mins, preparation, report_tat_hrs, is_home_collection
    `)
    .eq('hospital_id', centreId)   // ← always scoped to centre
    .eq('module', 'diagnostic')    // ← never mix modules
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('category', { ascending: true })
    .order('name',     { ascending: true })

  if (error) {
    console.error('[getDiagnosticServices] error:', error.message)
    return []
  }
  if (!data || data.length === 0) return []

  // Group by category
  const groupMap = new Map<string, DiagnosticService[]>()

  for (const s of data) {
    const cat = s.category?.trim() || 'Other'
    if (!groupMap.has(cat)) groupMap.set(cat, [])
    groupMap.get(cat)!.push({
      id:                 s.id,
      name:               s.name,
      description:        s.description,
      code:               s.code,
      category:           s.category,
      price:              s.price,
      duration_mins:      s.duration_mins,
      preparation:        s.preparation,
      report_tat_hrs:     s.report_tat_hrs,
      is_home_collection: s.is_home_collection,
    })
  }

  // Sort categories alphabetically, 'Other' always last
  const groups: DiagnosticServiceGroup[] = []
  const sorted = [...groupMap.keys()].sort((a, b) => {
    if (a === 'Other') return 1
    if (b === 'Other') return -1
    return a.localeCompare(b)
  })

  for (const cat of sorted) {
    groups.push({ category: cat, services: groupMap.get(cat)! })
  }

  return groups
}

// =============================================================================
// 4. GET DIAGNOSTIC SERVICES BY IDs — used on confirm page
//    Validates that all service IDs belong to the centre.
//    Security: never trust client-supplied service IDs without re-validation.
// =============================================================================

export async function getDiagnosticServicesByIds(
  centreId:   string,
  serviceIds: string[],
): Promise<DiagnosticService[]> {
  if (serviceIds.length === 0) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('services')
    .select(`
      id, name, description, code, category, price,
      duration_mins, preparation, report_tat_hrs, is_home_collection
    `)
    .eq('hospital_id', centreId)   // ← scoped — cannot fetch another centre's services
    .eq('module', 'diagnostic')
    .eq('is_active', true)
    .is('deleted_at', null)
    .in('id', serviceIds)

  if (error) {
    console.error('[getDiagnosticServicesByIds] error:', error.message)
    return []
  }

  return (data ?? []).map((s) => ({
    id:                 s.id,
    name:               s.name,
    description:        s.description,
    code:               s.code,
    category:           s.category,
    price:              s.price,
    duration_mins:      s.duration_mins,
    preparation:        s.preparation,
    report_tat_hrs:     s.report_tat_hrs,
    is_home_collection: s.is_home_collection,
  }))
}