'use server'

/**
 * lib/ambulance/actions.ts
 * MYOP Healthcare Marketplace — Ambulance Module
 *
 * WRITE ONLY — server actions for booking.
 * Queries are in lib/ambulance/queries.ts
 *
 * DB columns used (must match migration_008 exactly):
 *   ambulance_bookings: patient_id, ambulance_id, status, pickup_address,
 *     pickup_lat, pickup_lng, destination_name, destination_address,
 *     patient_name, patient_phone, notes, estimated_minutes
 *   ambulances: is_available, vehicle_number
 */

import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types/dto'

// =============================================================================
// INPUT TYPE
// =============================================================================

export interface BookAmbulanceInput {
  pickupAddress:       string
  pickupLat?:          number
  pickupLng?:          number
  destinationName:     string
  destinationAddress?: string
  patientName:         string
  patientPhone:        string
  notes?:              string
}

export interface BookAmbulanceResult {
  bookingId: string
}

// =============================================================================
// bookAmbulance
// =============================================================================

export async function bookAmbulance(
  input: BookAmbulanceInput,
): Promise<ActionResult<BookAmbulanceResult>> {
  // ── Validate session ──
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Please sign in to book an ambulance.' }

  // ── Validate required fields ──
  if (!input.pickupAddress.trim())   return { success: false, error: 'Please enter a pickup address.' }
  if (!input.destinationName.trim()) return { success: false, error: 'Please enter a destination.' }
  if (!input.patientName.trim())     return { success: false, error: 'Please enter the patient name.' }

  const cleanedPhone = input.patientPhone.replace(/\s/g, '')
  if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number.' }
  }

  const serviceClient = createServiceClient()

  // ── Find first available ambulance ──
  const { data: ambulanceRows } = await (serviceClient as any)
    .from('ambulances')
    .select('id, driver_name, driver_phone, vehicle_number')  // ← vehicle_number matches DB
    .eq('is_available', true)
    .is('deleted_at', null)
    .limit(1)

  const ambulance = ambulanceRows?.[0] ?? null

  // ── Create booking ──
  const { data: booking, error: bookingErr } = await (serviceClient as any)
    .from('ambulance_bookings')
    .insert({
      patient_id:          user.id,
      ambulance_id:        ambulance?.id ?? null,
      status:              'requested',
      pickup_address:      input.pickupAddress.trim(),
      pickup_lat:          input.pickupLat   ?? null,
      pickup_lng:          input.pickupLng   ?? null,
      destination_name:    input.destinationName.trim(),
      destination_address: input.destinationAddress?.trim() ?? null,
      patient_name:        input.patientName.trim(),
      patient_phone:       cleanedPhone,
      notes:               input.notes?.trim() ?? null,
      estimated_minutes:   ambulance ? 8 : 15,  // ← matches DB column name
    })
    .select('id')
    .single()

  if (bookingErr || !booking) {
    console.error('[bookAmbulance]', bookingErr?.message)
    return { success: false, error: 'Booking failed. Please try again or call 108.' }
  }

  // ── Mark ambulance unavailable ──
  if (ambulance) {
    await (serviceClient as any)
      .from('ambulances')
      .update({ is_available: false, updated_at: new Date().toISOString() })
      .eq('id', ambulance.id)
  }

  return { success: true, data: { bookingId: booking.id } }
}