/**
 * lib/supabase/cached-queries.ts
 * MYOP Healthcare Marketplace
 *
 * Cached public DB queries using Next.js unstable_cache.
 *
 * WHY createServiceClient() and not createClient():
 *   unstable_cache() cannot access dynamic data sources (cookies, headers)
 *   inside its callback. createClient() calls cookies() which throws.
 *   createServiceClient() uses no cookies — safe inside cache scope.
 *   These are all public READ queries (approved hospitals/centres/clinics)
 *   so bypassing RLS is fine — the queries already filter by approval_status.
 *
 * Cache strategy:
 *   - Public listing pages (search): 60s revalidate
 *   - Detail pages (by slug): 60s revalidate
 *   - Tags used for manual revalidation when admin approves/updates a hospital
 */

import { unstable_cache } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'

// =============================================================================
// CACHE TAGS
// =============================================================================

export const CACHE_TAGS = {
  hospitals:  'hospitals',
  diagnostic: 'diagnostic-centres',
  clinics:    'clinics',
} as const

// =============================================================================
// TYPES — duplicated here to avoid importing from files that call createClient
// =============================================================================

export interface HospitalSearchResult {
  id:            string
  name:          string
  slug:          string
  logo_url:      string | null
  city:          string
  state:         string
  address_line1: string
  phone:         string
  description:   string | null
  doctors_count: number
}

export interface HospitalDetail {
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
  departments:   { id: string; name: string; description: string | null; icon_url: string | null }[]
}

export interface DoctorSummary {
  id:               string
  slug:             string
  full_name:        string
  photo_url:        string | null
  gender:           string | null
  specialisation:   string
  qualification:    string
  experience_years: number
  languages:        string[] | null
  consultation_fee: number
  department:       { id: string; name: string } | null
}

export interface DiagnosticCentreSearchResult {
  id:             string
  name:           string
  slug:           string
  logo_url:       string | null
  city:           string
  state:          string
  address_line1:  string
  phone:          string
  description:    string | null
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

export interface DiagnosticServiceGroup {
  category: string
  services: DiagnosticService[]
}

export interface ClinicSearchResult {
  id:               string
  name:             string
  slug:             string
  logo_url:         string | null
  city:             string
  state:            string
  address_line1:    string
  phone:            string
  description:      string | null
  speciality:       string | null
  departments_count: number
}

export interface ClinicDepartment {
  id:          string
  name:        string
  description: string | null
  icon_url:    string | null
  fee:         number | null
  has_doctors: boolean
}

export interface ClinicDetail {
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
  departments:   ClinicDepartment[]
}

// =============================================================================
// HOSPITAL QUERIES
// =============================================================================

export const cachedSearchHospitals = unstable_cache(
  async (query: string): Promise<HospitalSearchResult[]> => {
    const supabase = createServiceClient()   // ← no cookies, safe in cache scope
    const q = query.trim()

    if (!q) {
      const { data, error } = await (supabase as any)
        .from('hospitals')
        .select('id, name, slug, logo_url, city, state, address_line1, phone, description')
        .eq('module', 'hospital')
        .eq('approval_status', 'approved')
        .is('deleted_at', null)
        .order('name', { ascending: true })
        .limit(50)

      if (error || !data) return []

      const ids = data.map((h: any) => h.id)
      const { data: doctorRows } = await (supabase as any)
        .from('doctors')
        .select('hospital_id')
        .eq('is_active', true)
        .is('deleted_at', null)
        .in('hospital_id', ids)

      const countMap: Record<string, number> = {}
      for (const d of doctorRows ?? []) {
        countMap[d.hospital_id] = (countMap[d.hospital_id] ?? 0) + 1
      }

      return data.map((h: any) => ({ ...h, doctors_count: countMap[h.id] ?? 0 }))
    }

    const pattern = `%${q}%`
    const [{ data: byName }, { data: byDoctor }, { data: byDept }] = await Promise.all([
      (supabase as any).from('hospitals').select('id').eq('module', 'hospital').eq('approval_status', 'approved').is('deleted_at', null).ilike('name', pattern),
      (supabase as any).from('doctors').select('hospital_id').eq('is_active', true).is('deleted_at', null).or(`full_name.ilike.${pattern},specialisation.ilike.${pattern}`),
      (supabase as any).from('departments').select('hospital_id').eq('is_active', true).is('deleted_at', null).ilike('name', pattern),
    ])

    const idSet = new Set<string>([
      ...(byName ?? []).map((h: any) => h.id),
      ...(byDoctor ?? []).map((d: any) => d.hospital_id),
      ...(byDept ?? []).map((d: any) => d.hospital_id),
    ])

    if (idSet.size === 0) return []
    const ids = Array.from(idSet)

    const { data: matched } = await (supabase as any)
      .from('hospitals')
      .select('id, name, slug, logo_url, city, state, address_line1, phone, description')
      .eq('module', 'hospital').eq('approval_status', 'approved').is('deleted_at', null)
      .in('id', ids).order('name', { ascending: true })

    if (!matched) return []

    const { data: doctorRows } = await (supabase as any)
      .from('doctors').select('hospital_id').eq('is_active', true).is('deleted_at', null).in('hospital_id', ids)

    const countMap: Record<string, number> = {}
    for (const d of doctorRows ?? []) countMap[d.hospital_id] = (countMap[d.hospital_id] ?? 0) + 1

    return matched.map((h: any) => ({ ...h, doctors_count: countMap[h.id] ?? 0 }))
  },
  ['search-hospitals'],
  { revalidate: 60, tags: [CACHE_TAGS.hospitals] },
)

export const cachedGetHospitalBySlug = unstable_cache(
  async (slug: string): Promise<HospitalDetail | null> => {
    const supabase = createServiceClient()

    const { data, error } = await (supabase as any)
      .from('hospitals')
      .select('id, name, slug, logo_url, description, city, state, pincode, address_line1, address_line2, phone, email, website')
      .eq('module', 'hospital').eq('approval_status', 'approved').is('deleted_at', null)
      .eq('slug', slug).single()

    if (error || !data) return null

    const { data: depts } = await (supabase as any)
      .from('departments')
      .select('id, name, description, icon_url')
      .eq('hospital_id', data.id).eq('is_active', true).is('deleted_at', null)
      .order('name', { ascending: true })

    return { ...data, departments: depts ?? [] }
  },
  ['hospital-by-slug'],
  { revalidate: 60, tags: [CACHE_TAGS.hospitals] },
)

export const cachedGetHospitalDoctors = unstable_cache(
  async (hospitalId: string, departmentId?: string): Promise<DoctorSummary[]> => {
    const supabase = createServiceClient()

    let query = (supabase as any)
      .from('doctors')
      .select('id, slug, full_name, photo_url, gender, specialisation, qualification, experience_years, languages, consultation_fee, department_id')
      .eq('hospital_id', hospitalId).eq('is_active', true).is('deleted_at', null)
      .order('full_name', { ascending: true })

    if (departmentId) query = query.eq('department_id', departmentId)

    const { data, error } = await query
    if (error || !data || data.length === 0) return []

    const deptIds = [...new Set(data.map((d: any) => d.department_id).filter(Boolean))]
    const deptMap: Record<string, { id: string; name: string }> = {}

    if (deptIds.length > 0) {
      const { data: depts } = await (supabase as any)
        .from('departments').select('id, name').in('id', deptIds)
      for (const d of depts ?? []) deptMap[d.id] = { id: d.id, name: d.name }
    }

    return data.map((d: any) => ({
      id: d.id, slug: d.slug, full_name: d.full_name, photo_url: d.photo_url,
      gender: d.gender, specialisation: d.specialisation, qualification: d.qualification,
      experience_years: d.experience_years, languages: d.languages,
      consultation_fee: d.consultation_fee,
      department: d.department_id ? (deptMap[d.department_id] ?? null) : null,
    }))
  },
  ['hospital-doctors'],
  { revalidate: 60, tags: [CACHE_TAGS.hospitals] },
)

// =============================================================================
// DIAGNOSTIC QUERIES
// =============================================================================

export const cachedSearchDiagnosticCentres = unstable_cache(
  async (query: string): Promise<DiagnosticCentreSearchResult[]> => {
    const supabase = createServiceClient()
    const q = query.trim()

    if (!q) {
      const { data, error } = await (supabase as any)
        .from('hospitals')
        .select('id, name, slug, logo_url, city, state, address_line1, phone, description')
        .eq('module', 'diagnostic').eq('approval_status', 'approved').is('deleted_at', null)
        .order('name', { ascending: true }).limit(50)

      if (error || !data) return []

      const ids = data.map((c: any) => c.id)
      const { data: serviceRows } = await (supabase as any)
        .from('services').select('hospital_id').eq('module', 'diagnostic')
        .eq('is_active', true).is('deleted_at', null).in('hospital_id', ids)

      const countMap: Record<string, number> = {}
      for (const s of serviceRows ?? []) countMap[s.hospital_id] = (countMap[s.hospital_id] ?? 0) + 1

      return data.map((c: any) => ({ ...c, services_count: countMap[c.id] ?? 0 }))
    }

    const pattern = `%${q}%`
    const [{ data: byName }, { data: byService }] = await Promise.all([
      (supabase as any).from('hospitals').select('id').eq('module', 'diagnostic').eq('approval_status', 'approved').is('deleted_at', null).ilike('name', pattern),
      (supabase as any).from('services').select('hospital_id').eq('module', 'diagnostic').eq('is_active', true).is('deleted_at', null).or(`name.ilike.${pattern},category.ilike.${pattern}`),
    ])

    const idSet = new Set<string>([...(byName ?? []).map((c: any) => c.id), ...(byService ?? []).map((s: any) => s.hospital_id)])
    if (idSet.size === 0) return []
    const ids = Array.from(idSet)

    const { data: matched } = await (supabase as any)
      .from('hospitals').select('id, name, slug, logo_url, city, state, address_line1, phone, description')
      .eq('module', 'diagnostic').eq('approval_status', 'approved').is('deleted_at', null)
      .in('id', ids).order('name', { ascending: true })

    if (!matched) return []

    const { data: serviceRows } = await (supabase as any)
      .from('services').select('hospital_id').eq('module', 'diagnostic')
      .eq('is_active', true).is('deleted_at', null).in('hospital_id', ids)

    const countMap: Record<string, number> = {}
    for (const s of serviceRows ?? []) countMap[s.hospital_id] = (countMap[s.hospital_id] ?? 0) + 1

    return matched.map((c: any) => ({ ...c, services_count: countMap[c.id] ?? 0 }))
  },
  ['search-diagnostic'],
  { revalidate: 60, tags: [CACHE_TAGS.diagnostic] },
)

export const cachedGetDiagnosticCentreBySlug = unstable_cache(
  async (slug: string): Promise<DiagnosticCentreDetail | null> => {
    const supabase = createServiceClient()
    const { data, error } = await (supabase as any)
      .from('hospitals')
      .select('id, name, slug, logo_url, description, city, state, pincode, address_line1, address_line2, phone, email, website')
      .eq('module', 'diagnostic').eq('approval_status', 'approved').is('deleted_at', null)
      .eq('slug', slug).single()

    if (error || !data) return null
    return data
  },
  ['diagnostic-by-slug'],
  { revalidate: 60, tags: [CACHE_TAGS.diagnostic] },
)

export const cachedGetDiagnosticServices = unstable_cache(
  async (centreId: string): Promise<DiagnosticServiceGroup[]> => {
    const supabase = createServiceClient()
    const { data, error } = await (supabase as any)
      .from('services')
      .select('id, name, description, code, category, price, duration_mins, preparation, report_tat_hrs, is_home_collection')
      .eq('hospital_id', centreId).eq('module', 'diagnostic').eq('is_active', true).is('deleted_at', null)
      .order('category', { ascending: true }).order('name', { ascending: true })

    if (error || !data || data.length === 0) return []

    const groupMap = new Map<string, DiagnosticService[]>()
    for (const s of data) {
      const cat = s.category?.trim() || 'Other'
      if (!groupMap.has(cat)) groupMap.set(cat, [])
      groupMap.get(cat)!.push(s)
    }

    const sorted = [...groupMap.keys()].sort((a, b) => {
      if (a === 'Other') return 1
      if (b === 'Other') return -1
      return a.localeCompare(b)
    })

    return sorted.map(cat => ({ category: cat, services: groupMap.get(cat)! }))
  },
  ['diagnostic-services'],
  { revalidate: 60, tags: [CACHE_TAGS.diagnostic] },
)

// =============================================================================
// CLINIC QUERIES
// =============================================================================

export const cachedSearchClinics = unstable_cache(
  async (query: string): Promise<ClinicSearchResult[]> => {
    const supabase = createServiceClient()
    const q = query.trim()

    if (!q) {
      const { data, error } = await (supabase as any)
        .from('hospitals')
        .select('id, name, slug, logo_url, city, state, address_line1, phone, description')
        .eq('module', 'clinic').eq('approval_status', 'approved').is('deleted_at', null)
        .order('name', { ascending: true }).limit(50)

      if (error || !data) return []

      const ids = data.map((c: any) => c.id)
      const { data: depts } = await (supabase as any)
        .from('departments').select('hospital_id, name')
        .eq('is_active', true).is('deleted_at', null).in('hospital_id', ids)
        .order('name', { ascending: true })

      const specialityMap: Record<string, string> = {}
      const countMap: Record<string, number> = {}
      for (const d of depts ?? []) {
        countMap[d.hospital_id] = (countMap[d.hospital_id] ?? 0) + 1
        if (!specialityMap[d.hospital_id]) specialityMap[d.hospital_id] = d.name
      }

      return data.map((c: any) => ({ ...c, speciality: specialityMap[c.id] ?? null, departments_count: countMap[c.id] ?? 0 }))
    }

    const pattern = `%${q}%`
    const [{ data: byName }, { data: byDept }, { data: byDoctor }] = await Promise.all([
      (supabase as any).from('hospitals').select('id').eq('module', 'clinic').eq('approval_status', 'approved').is('deleted_at', null).ilike('name', pattern),
      (supabase as any).from('departments').select('hospital_id').eq('is_active', true).is('deleted_at', null).ilike('name', pattern),
      (supabase as any).from('doctors').select('hospital_id').eq('is_active', true).is('deleted_at', null).or(`full_name.ilike.${pattern},specialisation.ilike.${pattern}`),
    ])

    const idSet = new Set<string>([...(byName ?? []).map((c: any) => c.id), ...(byDept ?? []).map((d: any) => d.hospital_id), ...(byDoctor ?? []).map((d: any) => d.hospital_id)])
    if (idSet.size === 0) return []
    const ids = Array.from(idSet)

    const { data: matched } = await (supabase as any)
      .from('hospitals').select('id, name, slug, logo_url, city, state, address_line1, phone, description')
      .eq('module', 'clinic').eq('approval_status', 'approved').is('deleted_at', null)
      .in('id', ids).order('name', { ascending: true })

    if (!matched) return []

    const { data: depts2 } = await (supabase as any)
      .from('departments').select('hospital_id, name').eq('is_active', true).is('deleted_at', null)
      .in('hospital_id', ids).order('name', { ascending: true })

    const specialityMap: Record<string, string> = {}
    const countMap: Record<string, number> = {}
    for (const d of depts2 ?? []) {
      countMap[d.hospital_id] = (countMap[d.hospital_id] ?? 0) + 1
      if (!specialityMap[d.hospital_id]) specialityMap[d.hospital_id] = d.name
    }

    return matched.map((c: any) => ({ ...c, speciality: specialityMap[c.id] ?? null, departments_count: countMap[c.id] ?? 0 }))
  },
  ['search-clinics'],
  { revalidate: 60, tags: [CACHE_TAGS.clinics] },
)

export const cachedGetClinicBySlug = unstable_cache(
  async (slug: string): Promise<ClinicDetail | null> => {
    const supabase = createServiceClient()

    const { data, error } = await (supabase as any)
      .from('hospitals')
      .select('id, name, slug, logo_url, description, city, state, pincode, address_line1, address_line2, phone, email, website')
      .eq('module', 'clinic').eq('approval_status', 'approved').is('deleted_at', null)
      .eq('slug', slug).single()

    if (error || !data) return null

    const { data: depts } = await (supabase as any)
      .from('departments').select('id, name, description, icon_url, fee')
      .eq('hospital_id', data.id).eq('is_active', true).is('deleted_at', null)
      .order('name', { ascending: true })

    if (!depts || depts.length === 0) return { ...data, departments: [] }

    const deptIds = depts.map((d: any) => d.id)
    const { data: doctorRows } = await (supabase as any)
      .from('doctors').select('department_id')
      .eq('hospital_id', data.id).eq('is_active', true).is('deleted_at', null)
      .in('department_id', deptIds)

    const deptsWithDoctors = new Set((doctorRows ?? []).map((d: any) => d.department_id))

    return {
      ...data,
      departments: depts.map((d: any) => ({ ...d, has_doctors: deptsWithDoctors.has(d.id) })),
    }
  },
  ['clinic-by-slug'],
  { revalidate: 60, tags: [CACHE_TAGS.clinics] },
)