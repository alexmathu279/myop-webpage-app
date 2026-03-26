/**
 * lib/booking/hospital.ts
 * MYOP Healthcare Marketplace
 *
 * Patient-facing READ queries for the hospital booking module.
 *
 * Rules:
 *   - Every hospitals query includes .eq('module', 'hospital')
 *   - Every hospitals query includes approval_status = 'approved'
 *   - Every doctors query includes .eq('hospital_id', hospitalId)
 *   - Slots filtered entirely in DB
 *   - No raw DB rows returned — clean mapped shapes only
 *   - No await createClient() at module level
 *   - No writes in this file
 */

import { createClient } from '@/lib/supabase/server'

// =============================================================================
// RETURN TYPES
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
  departments:   DepartmentSummary[]
}

export interface DepartmentSummary {
  id:          string
  name:        string
  description: string | null
  icon_url:    string | null
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

export interface DoctorDetail extends DoctorSummary {
  bio:                 string | null
  registration_number: string
  hospital_id:         string
}

export interface SlotResult {
  id:         string
  slot_start: string
  slot_end:   string
  spots_left: number
}

export interface SlotDetail {
  id:          string
  slot_start:  string
  slot_end:    string
  spots_left:  number
  doctor_id:   string
  hospital_id: string
}

// =============================================================================
// 1. SEARCH HOSPITALS
// =============================================================================

export async function searchHospitals(
  query: string,
): Promise<HospitalSearchResult[]> {
  const supabase = await createClient()
  const q = query.trim()

  if (!q) {
    const { data, error } = await supabase
      .from('hospitals')
      .select('id, name, slug, logo_url, city, state, address_line1, phone, description')
      .eq('module', 'hospital')
      .eq('approval_status', 'approved')
      .is('deleted_at', null)
      .order('name', { ascending: true })
      .limit(50)

    if (error) {
      console.error('[searchHospitals] list error:', error.message)
      return []
    }
    if (!data || data.length === 0) return []

    const hospitalIds = data.map((h) => h.id)
    const { data: doctorRows } = await supabase
      .from('doctors')
      .select('hospital_id')
      .eq('is_active', true)
      .is('deleted_at', null)
      .in('hospital_id', hospitalIds)

    const countMap: Record<string, number> = {}
    for (const d of doctorRows ?? []) {
      countMap[d.hospital_id] = (countMap[d.hospital_id] ?? 0) + 1
    }

    return data.map((h) => ({
      id:            h.id,
      name:          h.name,
      slug:          h.slug,
      logo_url:      h.logo_url,
      city:          h.city,
      state:         h.state,
      address_line1: h.address_line1,
      phone:         h.phone,
      description:   h.description,
      doctors_count: countMap[h.id] ?? 0,
    }))
  }

  const pattern = `%${q}%`

  const [
    { data: byName },
    { data: byDoctor },
    { data: byDepartment },
  ] = await Promise.all([
    supabase
      .from('hospitals')
      .select('id')
      .eq('module', 'hospital')
      .eq('approval_status', 'approved')
      .is('deleted_at', null)
      .ilike('name', pattern),
    supabase
      .from('doctors')
      .select('hospital_id')
      .eq('is_active', true)
      .is('deleted_at', null)
      .or(`full_name.ilike.${pattern},specialisation.ilike.${pattern}`),
    supabase
      .from('departments')
      .select('hospital_id')
      .eq('is_active', true)
      .is('deleted_at', null)
      .ilike('name', pattern),
  ])

  const idSet = new Set<string>([
    ...(byName       ?? []).map((h) => h.id),
    ...(byDoctor     ?? []).map((d) => d.hospital_id),
    ...(byDepartment ?? []).map((d) => d.hospital_id),
  ])

  if (idSet.size === 0) return []

  const ids = Array.from(idSet)

  const { data: matched, error: matchErr } = await supabase
    .from('hospitals')
    .select('id, name, slug, logo_url, city, state, address_line1, phone, description')
    .eq('module', 'hospital')
    .eq('approval_status', 'approved')
    .is('deleted_at', null)
    .in('id', ids)
    .order('name', { ascending: true })

  if (matchErr || !matched) return []

  const { data: doctorRows2 } = await supabase
    .from('doctors')
    .select('hospital_id')
    .eq('is_active', true)
    .is('deleted_at', null)
    .in('hospital_id', ids)

  const countMap2: Record<string, number> = {}
  for (const d of doctorRows2 ?? []) {
    countMap2[d.hospital_id] = (countMap2[d.hospital_id] ?? 0) + 1
  }

  return matched.map((h) => ({
    id:            h.id,
    name:          h.name,
    slug:          h.slug,
    logo_url:      h.logo_url,
    city:          h.city,
    state:         h.state,
    address_line1: h.address_line1,
    phone:         h.phone,
    description:   h.description,
    doctors_count: countMap2[h.id] ?? 0,
  }))
}

// =============================================================================
// 2. GET HOSPITAL BY SLUG
// =============================================================================

export async function getHospitalBySlug(
  slug: string,
): Promise<HospitalDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hospitals')
    .select(`
      id, name, slug, logo_url, description,
      city, state, pincode, address_line1, address_line2,
      phone, email, website
    `)
    .eq('module', 'hospital')
    .eq('approval_status', 'approved')
    .is('deleted_at', null)
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') console.error('[getHospitalBySlug] error:', error.message)
    return null
  }
  if (!data) return null

  const { data: depts, error: deptErr } = await supabase
    .from('departments')
    .select('id, name, description, icon_url')
    .eq('hospital_id', data.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (deptErr) console.error('[getHospitalBySlug] departments error:', deptErr.message)

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
    departments:   (depts ?? []).map((d) => ({
      id:          d.id,
      name:        d.name,
      description: d.description,
      icon_url:    d.icon_url,
    })),
  }
}

// =============================================================================
// 3. GET HOSPITAL DOCTORS
// =============================================================================

export async function getHospitalDoctors(
  hospitalId:    string,
  departmentId?: string,
): Promise<DoctorSummary[]> {
  const supabase = await createClient()

  let query = supabase
    .from('doctors')
    .select(`
      id, slug, full_name, photo_url, gender,
      specialisation, qualification, experience_years,
      languages, consultation_fee, department_id
    `)
    .eq('hospital_id', hospitalId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('full_name', { ascending: true })

  if (departmentId) query = query.eq('department_id', departmentId)

  const { data, error } = await query

  if (error) {
    console.error('[getHospitalDoctors] error:', error.message)
    return []
  }
  if (!data || data.length === 0) return []

  const deptIds = [...new Set(
    data.map((d) => d.department_id).filter((id): id is string => !!id)
  )]

  const deptMap: Record<string, { id: string; name: string }> = {}
  if (deptIds.length > 0) {
    const { data: depts } = await supabase
      .from('departments')
      .select('id, name')
      .in('id', deptIds)
    for (const d of depts ?? []) deptMap[d.id] = { id: d.id, name: d.name }
  }

  return data.map((d) => ({
    id:               d.id,
    slug:             d.slug,
    full_name:        d.full_name,
    photo_url:        d.photo_url,
    gender:           d.gender,
    specialisation:   d.specialisation,
    qualification:    d.qualification,
    experience_years: d.experience_years,
    languages:        d.languages,
    consultation_fee: d.consultation_fee,
    department:       d.department_id ? (deptMap[d.department_id] ?? null) : null,
  }))
}

// =============================================================================
// 4. GET DOCTOR BY ID
// =============================================================================

export async function getDoctorById(
  doctorId:   string,
  hospitalId: string,
): Promise<DoctorDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('doctors')
    .select(`
      id, slug, full_name, photo_url, gender,
      specialisation, qualification, experience_years,
      languages, consultation_fee, bio, registration_number,
      hospital_id, department_id
    `)
    .eq('id', doctorId)
    .eq('hospital_id', hospitalId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') console.error('[getDoctorById] error:', error.message)
    return null
  }
  if (!data) return null

  let department: { id: string; name: string } | null = null
  if (data.department_id) {
    const { data: dept } = await supabase
      .from('departments')
      .select('id, name')
      .eq('id', data.department_id)
      .single()
    if (dept) department = { id: dept.id, name: dept.name }
  }

  return {
    id:                  data.id,
    slug:                data.slug,
    full_name:           data.full_name,
    photo_url:           data.photo_url,
    gender:              data.gender,
    specialisation:      data.specialisation,
    qualification:       data.qualification,
    experience_years:    data.experience_years,
    languages:           data.languages,
    consultation_fee:    data.consultation_fee,
    bio:                 data.bio,
    registration_number: data.registration_number,
    hospital_id:         data.hospital_id,
    department,
  }
}

// =============================================================================
// 5. GET DOCTOR SLOTS
// =============================================================================

export async function getDoctorSlots(
  doctorId:   string,
  hospitalId: string,
  startDate:  string,
  endDate:    string,
): Promise<SlotResult[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointment_slots')
    .select('id, slot_start, slot_end, max_bookings, booked_count')
    .eq('doctor_id', doctorId)
    .eq('hospital_id', hospitalId)
    .eq('is_available', true)
    .eq('is_blocked', false)
    .is('deleted_at', null)
    .gte('slot_start', `${startDate}T00:00:00+00:00`)
    .lte('slot_start', `${endDate}T23:59:59+00:00`)
    .filter('slot_start', 'gt', 'now()')
    .order('slot_start', { ascending: true })

  if (error) {
    console.error('[getDoctorSlots] error:', error.message)
    return []
  }

  return (data ?? [])
    .filter((s) => s.booked_count < s.max_bookings)
    .map((s) => ({
      id:         s.id,
      slot_start: s.slot_start,
      slot_end:   s.slot_end,
      spots_left: s.max_bookings - s.booked_count,
    }))
}

// =============================================================================
// 6. GET SLOT BY ID — used on confirm page
//
// SECURITY: validates everything server-side:
//   - Slot must exist
//   - must be available + not blocked
//   - booked_count < max_bookings (not fully booked)
//   - slot_start must be in the future
//
// Returns null if any check fails — confirm page redirects away.
// =============================================================================

export async function getSlotById(
  slotId: string,
): Promise<SlotDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointment_slots')
    .select('id, slot_start, slot_end, max_bookings, booked_count, doctor_id, hospital_id')
    .eq('id', slotId)
    .eq('is_available', true)
    .eq('is_blocked', false)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') console.error('[getSlotById] error:', error.message)
    return null
  }
  if (!data) return null

  // Fully booked — defence-in-depth (RLS also checks this)
  if (data.booked_count >= data.max_bookings) return null

  // Slot is in the past — compare in JS using UTC
  if (new Date(data.slot_start) <= new Date()) return null

  return {
    id:          data.id,
    slot_start:  data.slot_start,
    slot_end:    data.slot_end,
    spots_left:  data.max_bookings - data.booked_count,
    doctor_id:   data.doctor_id,
    hospital_id: data.hospital_id,
  }
}