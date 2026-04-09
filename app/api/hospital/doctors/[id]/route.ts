/**
 * app/api/hospital/doctors/[id]/route.ts
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStaffHospital } from '@/lib/hospital/actions'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const staff = await getStaffHospital()
  if (!staff) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  const in14days = new Date()
  in14days.setDate(in14days.getDate() + 14)

  const [{ data: doctor }, { data: schedules }, { data: slots }] = await Promise.all([
    (supabase as any)
      .from('doctors')
      .select('id, full_name, specialisation')
      .eq('id', id)
      .eq('hospital_id', staff.hospitalId)
      .is('deleted_at', null)
      .single(),
    (supabase as any)
      .from('doctor_schedules')
      .select('id, day_of_week, start_time, end_time, slot_duration_mins, max_patients, effective_from, effective_until, is_active')
      .eq('doctor_id', id)
      .eq('hospital_id', staff.hospitalId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('day_of_week', { ascending: true }),
    (supabase as any)
      .from('appointment_slots')
      .select('id, slot_start, slot_end, is_available, is_blocked, booked_count, max_bookings')
      .eq('doctor_id', id)
      .eq('hospital_id', staff.hospitalId)
      .gte('slot_start', new Date().toISOString())
      .lte('slot_start', in14days.toISOString())
      .is('deleted_at', null)
      .order('slot_start', { ascending: true }),
  ])

  if (!doctor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ...doctor, schedules: schedules ?? [], slots: slots ?? [] })
}