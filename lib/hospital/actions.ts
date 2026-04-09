'use server'

/**
 * lib/hospital/actions.ts
 * MYOP Healthcare Marketplace — Hospital Staff Server Actions
 * Phase 4
 *
 * Actions:
 *   getStaffHospital     — get the hospital_id for the current staff member
 *   createDoctor         — add a new doctor
 *   updateDoctor         — edit doctor details
 *   deleteDoctor         — soft delete a doctor
 *   upsertSchedule       — create or update a weekly schedule for a doctor
 *   deleteSchedule       — remove a schedule day
 *   generateSlots        — auto-generate appointment slots from weekly schedules
 *   blockDate            — block a specific date for a doctor
 *   createService        — add a service with pricing
 *   updateService        — edit service details
 *   deleteService        — soft delete a service
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { validateForm, securityLogger } from '@/lib/security'
import type { UserRole } from '@/types/domain'
import type { ActionResult } from '@/types/dto'

// ---------------------------------------------------------------------------
// Helper — get current staff's hospital_id
// ---------------------------------------------------------------------------

export async function getStaffHospital(): Promise<{
  hospitalId: string
  module: string
  userId: string
} | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: UserRole }>()

  if (profile?.role !== 'hospital_staff' && profile?.role !== 'admin') return null

  const { data: staffRecord } = await (supabase as any)
    .from('hospital_staff')
    .select('hospital_id, hospitals(module)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single()

  if (!staffRecord) return null

  return {
    hospitalId: staffRecord.hospital_id,
    module:     staffRecord.hospitals?.module ?? 'hospital',
    userId:     user.id,
  }
}

// ---------------------------------------------------------------------------
// Doctor schemas
// ---------------------------------------------------------------------------

// Replace DoctorSchema
const DoctorSchema = z.object({
  full_name:           z.string().trim().min(2).max(100),
  department_id:       z.string().uuid('Please select a department.'),  // now required
  qualification:       z.string().trim().min(2).max(200),
  registration_number: z.string().trim().min(2).max(50),
  experience_years:    z.coerce.number().min(0).max(80).default(0),
  consultation_fee:    z.coerce.number().min(0),
  gender:              z.enum(['male', 'female', 'other']).optional(),
  bio:                 z.string().trim().max(1000).optional(),
  languages:           z.string().trim().max(200).optional(),
})

// ---------------------------------------------------------------------------
// createDoctor
// ---------------------------------------------------------------------------

export async function createDoctor(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const staff = await getStaffHospital()
  if (!staff) return { success: false, error: 'Unauthorised.' }

  const validation = validateForm(DoctorSchema, formData)
  if (!validation.success) return validation

  const {
    full_name, department_id, qualification,
    registration_number, experience_years, consultation_fee,
    gender, bio, languages,
  } = validation.data

  const supabaseRead = await createClient()
  const { data: dept } = await (supabaseRead as any)
  .from('departments')
  .select('name')
  .eq('id', department_id)
  .eq('hospital_id', staff.hospitalId)
  .single()

if (!dept) return { success: false, error: 'Selected department not found.' }

const specialisation = dept.name  // derive from department

  const languagesArray = languages
    ? languages.split(',').map(l => l.trim()).filter(Boolean)
    : []

  const supabase = createServiceClient()

  const { data: doctor, error } = await (supabase as any)
    .from('doctors')
    .insert({
      hospital_id:         staff.hospitalId,
      department_id,
      full_name,
      qualification,
      specialisation,
      registration_number,
      experience_years:    experience_years ?? 0,
      consultation_fee,
      gender:              gender ?? null,
      bio:                 bio || null,
      languages:           languagesArray.length > 0 ? languagesArray : null,
      is_active:           true,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createDoctor]', error.message)
    return { success: false, error: 'Failed to add doctor. Please try again.' }
  }

  securityLogger.adminAction(staff.userId, 'create_doctor', doctor.id)
  revalidatePath('/hospital/doctors')
  redirect(`/hospital/doctors/${doctor.id}`)
}

// ---------------------------------------------------------------------------
// updateDoctor
// ---------------------------------------------------------------------------

const UpdateDoctorSchema = DoctorSchema.extend({
  doctor_id: z.string().uuid(),
})

export async function updateDoctor(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const staff = await getStaffHospital()
  if (!staff) return { success: false, error: 'Unauthorised.' }

  const validation = validateForm(UpdateDoctorSchema, formData)
  if (!validation.success) return validation

  const {
    doctor_id, full_name, qualification,
    registration_number, experience_years, consultation_fee,
    gender, bio, languages, department_id,
  } = validation.data

  const supabaseRead = await createClient()
  const { data: dept } = await (supabaseRead as any)
    .from('departments')
    .select('name')
    .eq('id', department_id)
    .eq('hospital_id', staff.hospitalId)
    .single()

  if (!dept) return { success: false, error: 'Selected department not found.' }

  const specialisation = dept.name
  
  const languagesArray = languages
    ? languages.split(',').map(l => l.trim()).filter(Boolean)
    : []

  const supabase = createServiceClient()

  const { error } = await (supabase as any)
    .from('doctors')
    .update({
      full_name,
      specialisation,
      qualification,
      registration_number,
      experience_years:    experience_years ?? 0,
      consultation_fee,
      gender:              gender ?? null,
      bio:                 bio || null,
      languages:           languagesArray.length > 0 ? languagesArray : null,
      department_id:       department_id || null,
    })
    .eq('id', doctor_id)
    .eq('hospital_id', staff.hospitalId)

  if (error) {
    console.error('[updateDoctor]', error.message)
    return { success: false, error: 'Failed to update doctor. Please try again.' }
  }

  securityLogger.adminAction(staff.userId, 'update_doctor', doctor_id)
  revalidatePath('/hospital/doctors')
  revalidatePath(`/hospital/doctors/${doctor_id}`)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// deleteDoctor
// ---------------------------------------------------------------------------

export async function deleteDoctor(formData: FormData): Promise<void> {
  const staff = await getStaffHospital()
  if (!staff) redirect('/auth/login')

  const doctorId = formData.get('doctor_id') as string
  if (!doctorId) return

  const supabase = createServiceClient()
  await (supabase as any)
    .from('doctors')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', doctorId)
    .eq('hospital_id', staff.hospitalId)

  securityLogger.adminAction(staff.userId, 'delete_doctor', doctorId)
  revalidatePath('/hospital/doctors')
  redirect('/hospital/doctors')
}

// ---------------------------------------------------------------------------
// upsertSchedule — create or update weekly recurring schedule
// ---------------------------------------------------------------------------

const ScheduleSchema = z.object({
  doctor_id:           z.string().uuid(),
  day_of_week:         z.coerce.number().min(0).max(6),
  start_time:          z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  end_time:            z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  slot_duration_mins:  z.coerce.number().min(5).max(120).default(15),
  max_patients:        z.coerce.number().min(1).max(100).default(1),
  effective_from:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effective_until:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  schedule_id:         z.string().uuid().optional().or(z.literal('')),
})

export async function upsertSchedule(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const staff = await getStaffHospital()
  if (!staff) return { success: false, error: 'Unauthorised.' }

  const validation = validateForm(ScheduleSchema, formData)
  if (!validation.success) return validation

  const {
    doctor_id, day_of_week, start_time, end_time,
    slot_duration_mins, max_patients,
    effective_from, effective_until, schedule_id,
  } = validation.data

  // Validate doctor belongs to this hospital
  const supabase = await createClient()
  const { data: doctor } = await (supabase as any)
    .from('doctors')
    .select('id')
    .eq('id', doctor_id)
    .eq('hospital_id', staff.hospitalId)
    .single()

  if (!doctor) return { success: false, error: 'Doctor not found.' }

  const serviceSupabase = createServiceClient()
  const scheduleData = {
    doctor_id,
    hospital_id:        staff.hospitalId,
    day_of_week,
    start_time:         `${start_time}:00`,
    end_time:           `${end_time}:00`,
    slot_duration_mins,
    max_patients,
    effective_from,
    effective_until:    effective_until || null,
    is_active:          true,
  }

  if (schedule_id) {
    await (serviceSupabase as any)
      .from('doctor_schedules')
      .update(scheduleData)
      .eq('id', schedule_id)
      .eq('hospital_id', staff.hospitalId)
  } else {
    await (serviceSupabase as any)
      .from('doctor_schedules')
      .insert(scheduleData)
  }

  revalidatePath(`/hospital/doctors/${doctor_id}/schedules`)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// deleteSchedule
// ---------------------------------------------------------------------------

export async function deleteSchedule(formData: FormData): Promise<void> {
  const staff = await getStaffHospital()
  if (!staff) redirect('/auth/login')

  const scheduleId = formData.get('schedule_id') as string
  const doctorId   = formData.get('doctor_id') as string
  if (!scheduleId) return

  const supabase = createServiceClient()
  await (supabase as any)
    .from('doctor_schedules')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', scheduleId)
    .eq('hospital_id', staff.hospitalId)

  revalidatePath(`/hospital/doctors/${doctorId}/schedules`)
  redirect(`/hospital/doctors/${doctorId}/schedules`)
}

// ---------------------------------------------------------------------------
// generateSlots — auto-generate appointment slots from weekly schedules
// Generates slots for the next N days from today
// ---------------------------------------------------------------------------

export async function generateSlots(formData: FormData): Promise<void> {
  const staff = await getStaffHospital()
  if (!staff) redirect('/auth/login')

  const doctorId  = formData.get('doctor_id') as string
  const daysAhead = parseInt((formData.get('days_ahead') as string) ?? '14', 10)
  if (!doctorId) return

  const supabase    = await createClient()
  const serviceSupa = createServiceClient()

  // Get active schedules for this doctor
  const { data: schedules } = await (supabase as any)
    .from('doctor_schedules')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('hospital_id', staff.hospitalId)
    .eq('is_active', true)
    .is('deleted_at', null)

  if (!schedules || schedules.length === 0) return

  // Delete all future unbooked slots before regenerating
  // Never delete slots that are already booked
  await (serviceSupa as any)
    .from('appointment_slots')
    .delete()
    .eq('doctor_id', doctorId)
    .eq('hospital_id', staff.hospitalId)
    .eq('booked_count', 0)      // only delete unbooked
    .eq('is_blocked', false)    // don't touch manually blocked dates
    .gte('slot_start', new Date().toISOString())  // only future slots

  // Get blocked dates (manually blocked by staff — keep these)
  const { data: blockedSlots } = await (supabase as any)
    .from('appointment_slots')
    .select('slot_start')
    .eq('doctor_id', doctorId)
    .eq('is_blocked', true)
    .is('deleted_at', null)

  const blockedDates = new Set(
    (blockedSlots ?? []).map((s: any) => s.slot_start.split('T')[0])
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const slotsToInsert: any[] = []

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dateStr   = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay()

    if (blockedDates.has(dateStr)) continue

    const daySchedules = schedules.filter((s: any) =>
      s.day_of_week === dayOfWeek &&
      dateStr >= s.effective_from &&
      (!s.effective_until || dateStr <= s.effective_until)
    )

    for (const schedule of daySchedules) {
      const [startH, startM] = schedule.start_time.split(':').map(Number)
      const [endH, endM]     = schedule.end_time.split(':').map(Number)

      const startMins = startH * 60 + startM
      const endMins   = endH * 60 + endM
      const duration  = schedule.slot_duration_mins

      for (let mins = startMins; mins + duration <= endMins; mins += duration) {
        const slotStart = new Date(date)
        slotStart.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
        const slotEnd = new Date(slotStart)
        slotEnd.setMinutes(slotEnd.getMinutes() + duration)

        slotsToInsert.push({
          doctor_id:    doctorId,
          hospital_id:  staff.hospitalId,
          schedule_id:  schedule.id,
          slot_start:   slotStart.toISOString(),
          slot_end:     slotEnd.toISOString(),
          max_bookings: schedule.max_patients,
          booked_count: 0,
          is_available: true,
          is_blocked:   false,
        })
      }
    }
  }

  if (slotsToInsert.length === 0) return

  // Simple insert now — no conflict possible since we deleted first
  await (serviceSupa as any)
    .from('appointment_slots')
    .insert(slotsToInsert)

  securityLogger.adminAction(staff.userId, 'generate_slots', doctorId)
  revalidatePath(`/hospital/doctors/${doctorId}/schedules`)
  redirect(`/hospital/doctors/${doctorId}/schedules`)
}

// ---------------------------------------------------------------------------
// blockDate — block all slots for a doctor on a specific date
// ---------------------------------------------------------------------------

export async function blockDate(formData: FormData): Promise<void> {
  const staff = await getStaffHospital()
  if (!staff) redirect('/auth/login')

  const doctorId  = formData.get('doctor_id') as string
  const blockDate = formData.get('block_date') as string
  if (!doctorId || !blockDate) return

  const supabase = createServiceClient()

  // Mark existing slots as blocked
  await (supabase as any)
    .from('appointment_slots')
    .update({ is_blocked: true, is_available: false })
    .eq('doctor_id', doctorId)
    .eq('hospital_id', staff.hospitalId)
    .gte('slot_start', `${blockDate}T00:00:00`)
    .lte('slot_start', `${blockDate}T23:59:59`)
    .eq('booked_count', 0)  // don't block already-booked slots

  revalidatePath(`/hospital/doctors/${doctorId}/schedules`)
  redirect(`/hospital/doctors/${doctorId}/schedules`)
}

// ---------------------------------------------------------------------------
// Service schemas
// ---------------------------------------------------------------------------

const ServiceSchema = z.object({
  name:               z.string().trim().min(2).max(200),
  description:        z.string().trim().max(500).optional(),
  category:           z.string().trim().max(100).optional(),
  price:              z.coerce.number().min(0),
  duration_mins:      z.coerce.number().min(0).optional(),
  preparation:        z.string().trim().max(500).optional(),
  report_tat_hrs:     z.coerce.number().min(0).optional(),
  is_home_collection: z.coerce.boolean().default(false),
})

// ---------------------------------------------------------------------------
// createService
// ---------------------------------------------------------------------------

export async function createService(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const staff = await getStaffHospital()
  if (!staff) return { success: false, error: 'Unauthorised.' }

  const validation = validateForm(ServiceSchema, formData)
  if (!validation.success) return validation

  const {
    name, description, category, price,
    duration_mins, preparation, report_tat_hrs, is_home_collection,
  } = validation.data

  const supabase = createServiceClient()

  const { data: service, error } = await (supabase as any)
    .from('services')
    .insert({
      hospital_id:        staff.hospitalId,
      module:             staff.module,
      name,
      description:        description || null,
      category:           category || null,
      price,
      duration_mins:      duration_mins ?? null,
      preparation:        preparation || null,
      report_tat_hrs:     report_tat_hrs ?? null,
      is_home_collection: is_home_collection ?? false,
      is_active:          true,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createService]', error.message)
    return { success: false, error: 'Failed to add service. Please try again.' }
  }

  securityLogger.adminAction(staff.userId, 'create_service', service.id)
  revalidatePath('/hospital/services')
  redirect('/hospital/services')
}

// ---------------------------------------------------------------------------
// updateService
// ---------------------------------------------------------------------------

const UpdateServiceSchema = ServiceSchema.extend({
  service_id: z.string().uuid(),
})

export async function updateService(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const staff = await getStaffHospital()
  if (!staff) return { success: false, error: 'Unauthorised.' }

  const validation = validateForm(UpdateServiceSchema, formData)
  if (!validation.success) return validation

  const {
    service_id, name, description, category, price,
    duration_mins, preparation, report_tat_hrs, is_home_collection,
  } = validation.data

  const supabase = createServiceClient()

  const { error } = await (supabase as any)
    .from('services')
    .update({
      name,
      description:        description || null,
      category:           category || null,
      price,
      duration_mins:      duration_mins ?? null,
      preparation:        preparation || null,
      report_tat_hrs:     report_tat_hrs ?? null,
      is_home_collection: is_home_collection ?? false,
    })
    .eq('id', service_id)
    .eq('hospital_id', staff.hospitalId)

  if (error) {
    console.error('[updateService]', error.message)
    return { success: false, error: 'Failed to update service. Please try again.' }
  }

  revalidatePath('/hospital/services')
  revalidatePath(`/hospital/services/${service_id}`)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// deleteService
// ---------------------------------------------------------------------------

export async function deleteService(formData: FormData): Promise<void> {
  const staff = await getStaffHospital()
  if (!staff) redirect('/auth/login')

  const serviceId = formData.get('service_id') as string
  if (!serviceId) return

  const supabase = createServiceClient()
  await (supabase as any)
    .from('services')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', serviceId)
    .eq('hospital_id', staff.hospitalId)

  revalidatePath('/hospital/services')
  redirect('/hospital/services')
}

