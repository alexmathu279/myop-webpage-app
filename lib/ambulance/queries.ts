/**
 * lib/ambulance/queries.ts
 * MYOP Healthcare Marketplace — Ambulance Module
 *
 * READ ONLY — no server actions here.
 * Server actions are in lib/ambulance/actions.ts
 *
 * Uses createServiceClient() for cached functions (no cookies in cache scope).
 * Uses createClient() for auth-scoped reads (getBookingById).
 */

import { unstable_cache }  from 'next/cache'
import { createServiceClient, createClient } from '@/lib/supabase/server'

// =============================================================================
// TYPES — match DB schema exactly (migration_008)
// =============================================================================

export interface Ambulance {
  id:             string
  vehicle_number: string   // ← matches DB column name
  type:           'basic' | 'advanced' | 'icu' | 'neonatal'
  driver_name:    string
  driver_phone:   string
  is_available:   boolean
  current_area:   string | null
}

export interface AmbulanceBooking {
  id:                 string
  status:             'requested' | 'confirmed' | 'on_the_way' | 'arrived' | 'completed' | 'cancelled'
  pickup_address:     string
  destination_name:   string
  destination_address: string | null
  patient_name:       string
  patient_phone:      string
  notes:              string | null
  estimated_minutes:  number | null   // ← matches DB column name
  created_at:         string
  ambulance: {
    id:             string
    vehicle_number: string
    type:           string
    driver_name:    string
    driver_phone:   string
  } | null
}

// Display labels — UI-only, not DB
export const AMBULANCE_TYPE_LABELS: Record<Ambulance['type'], string> = {
  basic:    'Basic Life Support',
  advanced: 'Advanced Life Support',
  icu:      'ICU Ambulance',
  neonatal: 'Neonatal Ambulance',
}

export const AMBULANCE_TYPE_DESCRIPTIONS: Record<Ambulance['type'], string> = {
  basic:    'Equipped for non-critical patient transport',
  advanced: 'Equipped with cardiac monitors and defibrillator',
  icu:      'Mobile ICU with ventilator and full life support',
  neonatal: 'Specialised for newborn and premature infant transport',
}

// =============================================================================
// 1. GET AVAILABLE AMBULANCES — cached 30s, public read
// =============================================================================

export const cachedGetAvailableAmbulances = unstable_cache(
  async (): Promise<Ambulance[]> => {
    const supabase = createServiceClient()
    const { data, error } = await (supabase as any)
      .from('ambulances')
      .select('id, vehicle_number, type, driver_name, driver_phone, is_available, current_area')
      .eq('is_available', true)
      .is('deleted_at', null)
      .order('type', { ascending: true })

    if (error) { console.error('[cachedGetAvailableAmbulances]', error.message); return [] }
    return data ?? []
  },
  ['available-ambulances'],
  { revalidate: 30, tags: ['ambulances'] },
)

// =============================================================================
// 2. GET BOOKING BY ID — auth-scoped, NOT cached
//    Only returns booking if it belongs to the authenticated user
// =============================================================================

export async function getBookingById(bookingId: string): Promise<AmbulanceBooking | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await (supabase as any)
    .from('ambulance_bookings')
    .select(`
      id, status, pickup_address, destination_name, destination_address,
      patient_name, patient_phone, notes, estimated_minutes, created_at,
      ambulances!ambulance_id (
        id, vehicle_number, type, driver_name, driver_phone
      )
    `)
    .eq('id', bookingId)
    .eq('patient_id', user.id)  // ← scoped to patient — cannot read others' bookings
    .is('deleted_at', null)
    .single()

  if (error || !data) return null

  return {
    id:                 data.id,
    status:             data.status,
    pickup_address:     data.pickup_address,
    destination_name:   data.destination_name,
    destination_address: data.destination_address,
    patient_name:       data.patient_name,
    patient_phone:      data.patient_phone,
    notes:              data.notes,
    estimated_minutes:  data.estimated_minutes,
    created_at:         data.created_at,
    ambulance:          data.ambulances ?? null,
  }
}