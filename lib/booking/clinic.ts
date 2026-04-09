/**
 * lib/booking/clinic.ts
 * MYOP Healthcare Marketplace
 *
 * Patient-facing READ queries for the clinic booking module.
 *
 * Rules:
 *   - Every clinics query includes .eq('module', 'clinic')
 *   - Every clinics query includes approval_status = 'approved'
 *   - Every doctors/departments query scoped to clinicId
 *   - No raw DB rows returned — clean mapped shapes only
 *   - No await createClient() at module level
 *   - No writes in this file
 *
 * Slot queries for clinic doctors reuse getDoctorSlots / getSlotById
 * from lib/booking/hospital.ts — same appointment_slots table.
 */

import { createClient } from '@/lib/supabase/server'

// =============================================================================
// RETURN TYPES
// =============================================================================

export interface ClinicSearchResult {
  id:              string
  name:            string
  slug:            string
  logo_url:        string | null
  city:            string
  state:           string
  address_line1:   string
  phone:           string
  description:     string | null
  /** Primary speciality — derived from first department name */
  speciality:      string | null
  departments_count: number
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

export interface ClinicDepartment {
  id:          string
  name:        string
  description: string | null
  icon_url:    string | null
  fee:         number | null
  /** True if this department has at least one active doctor */
  has_doctors: boolean
}

export interface ClinicDoctorSummary {
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
}

export interface ClinicDoctorDetail extends ClinicDoctorSummary {
  bio:                 string | null
  registration_number: string
  hospital_id:         string
  department:          { id: string; name: string } | null
}

// =============================================================================
// 1. SEARCH CLINICS
//    2-step: name match + department/doctor name match → merge IDs
// =============================================================================

export async function searchClinics(
  query: string,
): Promise<ClinicSearchResult[]> {
  const supabase = await createClient()
  const q = query.trim()

  if (!q) {
    const { data, error } = await supabase
      .from('hospitals')
      .select('id, name, slug, logo_url, city, state, address_line1, phone, description')
      .eq('module', 'clinic')
      .eq('approval_status', 'approved')
      .is('deleted_at', null)
      .order('name', { ascending: true })
      .limit(50)

    if (error) {
      console.error('[searchClinics] list error:', error.message)
      return []
    }
    if (!data || data.length === 0) return []

    const clinicIds = data.map((c) => c.id)

    // Fetch departments for speciality + count
    const { data: depts } = await supabase
      .from('departments')
      .select('hospital_id, name')
      .eq('is_active', true)
      .is('deleted_at', null)
      .in('hospital_id', clinicIds)
      .order('name', { ascending: true })

    // Build maps
    const specialityMap: Record<string, string>  = {}
    const countMap:      Record<string, number>  = {}
    for (const d of depts ?? []) {
      countMap[d.hospital_id] = (countMap[d.hospital_id] ?? 0) + 1
      if (!specialityMap[d.hospital_id]) {
        specialityMap[d.hospital_id] = d.name  // first dept name = primary speciality
      }
    }

    return data.map((c) => ({
      id:               c.id,
      name:             c.name,
      slug:             c.slug,
      logo_url:         c.logo_url,
      city:             c.city,
      state:            c.state,
      address_line1:    c.address_line1,
      phone:            c.phone,
      description:      c.description,
      speciality:       specialityMap[c.id] ?? null,
      departments_count: countMap[c.id] ?? 0,
    }))
  }

  // With query — 2-step search
  const pattern = `%${q}%`

  const [
    { data: byName },
    { data: byDept },
    { data: byDoctor },
  ] = await Promise.all([
    supabase
      .from('hospitals')
      .select('id')
      .eq('module', 'clinic')
      .eq('approval_status', 'approved')
      .is('deleted_at', null)
      .ilike('name', pattern),
    supabase
      .from('departments')
      .select('hospital_id')
      .eq('is_active', true)
      .is('deleted_at', null)
      .ilike('name', pattern),
    supabase
      .from('doctors')
      .select('hospital_id')
      .eq('is_active', true)
      .is('deleted_at', null)
      .or(`full_name.ilike.${pattern},specialisation.ilike.${pattern}`),
  ])

  const idSet = new Set<string>([
    ...(byName   ?? []).map((c) => c.id),
    ...(byDept   ?? []).map((d) => d.hospital_id),
    ...(byDoctor ?? []).map((d) => d.hospital_id),
  ])

  if (idSet.size === 0) return []

  const ids = Array.from(idSet)

  const { data: matched, error: matchErr } = await supabase
    .from('hospitals')
    .select('id, name, slug, logo_url, city, state, address_line1, phone, description')
    .eq('module', 'clinic')
    .eq('approval_status', 'approved')
    .is('deleted_at', null)
    .in('id', ids)
    .order('name', { ascending: true })

  if (matchErr || !matched) return []

  const { data: depts2 } = await supabase
    .from('departments')
    .select('hospital_id, name')
    .eq('is_active', true)
    .is('deleted_at', null)
    .in('hospital_id', ids)
    .order('name', { ascending: true })

  const specialityMap2: Record<string, string> = {}
  const countMap2:      Record<string, number> = {}
  for (const d of depts2 ?? []) {
    countMap2[d.hospital_id] = (countMap2[d.hospital_id] ?? 0) + 1
    if (!specialityMap2[d.hospital_id]) specialityMap2[d.hospital_id] = d.name
  }

  return matched.map((c) => ({
    id:               c.id,
    name:             c.name,
    slug:             c.slug,
    logo_url:         c.logo_url,
    city:             c.city,
    state:            c.state,
    address_line1:    c.address_line1,
    phone:            c.phone,
    description:      c.description,
    speciality:       specialityMap2[c.id] ?? null,
    departments_count: countMap2[c.id] ?? 0,
  }))
}

// =============================================================================
// 2. GET CLINIC BY SLUG
//    Returns clinic detail + departments with has_doctors flag.
//    has_doctors is checked by counting active doctors per department.
// =============================================================================

export async function getClinicBySlug(
  slug: string,
): Promise<ClinicDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('hospitals')
    .select(`
      id, name, slug, logo_url, description,
      city, state, pincode, address_line1, address_line2,
      phone, email, website
    `)
    .eq('module', 'clinic')
    .eq('approval_status', 'approved')
    .is('deleted_at', null)
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') console.error('[getClinicBySlug] error:', error.message)
    return null
  }
  if (!data) return null

  // Fetch departments separately
  const { data: depts, error: deptErr } = await supabase
    .from('departments')
    .select('id, name, description, icon_url, fee')
    .eq('hospital_id', data.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (deptErr) console.error('[getClinicBySlug] departments error:', deptErr.message)

  if (!depts || depts.length === 0) {
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
      departments:   [],
    }
  }

  // Check which departments have active doctors
  const deptIds = depts.map((d) => d.id)
  const { data: doctorRows } = await supabase
    .from('doctors')
    .select('department_id')
    .eq('hospital_id', data.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .in('department_id', deptIds)

  const deptsWithDoctors = new Set((doctorRows ?? []).map((d) => d.department_id))

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
    departments:   depts.map((d) => ({
      id:          d.id,
      name:        d.name,
      description: d.description,
      icon_url:    d.icon_url,
      fee:         d.fee,
      has_doctors: deptsWithDoctors.has(d.id),
    })),
  }
}

// =============================================================================
// 3. GET CLINIC DEPARTMENT BY ID
//    Used on the dept page to show header info + fee.
// =============================================================================

export async function getClinicDepartment(
  clinicId: string,
  deptId:   string,
): Promise<ClinicDepartment | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('departments')
    .select('id, name, description, icon_url, fee')
    .eq('id', deptId)
    .eq('hospital_id', clinicId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') console.error('[getClinicDepartment] error:', error.message)
    return null
  }
  if (!data) return null

  // Check if this dept has doctors
  const { data: doctorRows } = await supabase
    .from('doctors')
    .select('id')
    .eq('hospital_id', clinicId)
    .eq('department_id', deptId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .limit(1)

  return {
    id:          data.id,
    name:        data.name,
    description: data.description,
    icon_url:    data.icon_url,
    fee:         data.fee,
    has_doctors: (doctorRows ?? []).length > 0,
  }
}

// =============================================================================
// 4. GET CLINIC DOCTORS BY DEPARTMENT
//    Returns active doctors for a specific department within a clinic.
// =============================================================================

export async function getClinicDoctors(
  clinicId: string,
  deptId:   string,
): Promise<ClinicDoctorSummary[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('doctors')
    .select(`
      id, slug, full_name, photo_url, gender,
      specialisation, qualification, experience_years,
      languages, consultation_fee
    `)
    .eq('hospital_id', clinicId)
    .eq('department_id', deptId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('full_name', { ascending: true })

  if (error) {
    console.error('[getClinicDoctors] error:', error.message)
    return []
  }

  return (data ?? []).map((d) => ({
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
  }))
}

// =============================================================================
// 5. GET CLINIC DOCTOR BY ID
//    Full doctor detail for the slot picker header.
//    Scoped to clinicId + deptId.
// =============================================================================

export async function getClinicDoctorById(
  clinicId: string,
  deptId:   string,
  doctorId: string,
): Promise<ClinicDoctorDetail | null> {
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
    .eq('hospital_id', clinicId)
    .eq('department_id', deptId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') console.error('[getClinicDoctorById] error:', error.message)
    return null
  }
  if (!data) return null

  // Fetch department name
  let department: { id: string; name: string } | null = null
  const { data: dept } = await supabase
    .from('departments')
    .select('id, name')
    .eq('id', deptId)
    .single()
  if (dept) department = { id: dept.id, name: dept.name }

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