/**
 * types/dto.ts
 * MYOP Healthcare Marketplace
 *
 * DTO TYPES — Layer 3 of 3
 * (Data Transfer Objects: API requests, responses, server action payloads)
 *
 * Rules:
 *   - These are the shapes that cross boundaries: form → server action,
 *     server action → client, API route → caller
 *   - Import domain types from ./domain for field types
 *   - No Supabase client logic
 *   - No DB Row types imported directly
 *
 * Three independent booking modules — keep their DTOs separate:
 *   1. Hospital  → doctor appointments
 *   2. Diagnostic → lab tests
 *   3. Clinic    → department visits
 */

import type {
  UserRole,
  BookingModule,
  AppointmentStatus,
  OrderStatus,
  RefundStatus,
  PayoutStatus,
} from './domain'

// =============================================================================
// SERVER ACTION RESULT
// Standard envelope for all Server Action return values.
// =============================================================================

/**
 * Every Server Action returns this shape.
 * T defaults to void for actions with no meaningful return data.
 * useActionState on the client reads success/error to update UI.
 *
 * @example
 * // Action with no payload
 * export async function signOut(): Promise<ActionResult> { ... }
 *
 * // Action returning data
 * export async function completeOnboard(): Promise<ActionResult<'onboarded'>> { ... }
 */
export type ActionResult<T = void> =
  | { success: true;  data: T }
  | { success: false; error: string }

// =============================================================================
// AUTH DTOs
// =============================================================================

/** Payload from the patient signup form. */
export interface SignUpInput {
  email:     string
  password:  string
  full_name: string
  phone:     string
}

/** Payload from the shared login form. */
export interface SignInInput {
  email:    string
  password: string
}

/** Payload from the invite acceptance form (staff/admin). */
export interface AcceptInviteInput {
  full_name:        string
  password:         string
  confirm_password: string
}

/** Payload from the patient onboarding form. */
export interface OnboardingInput {
  date_of_birth: string   // ISO date e.g. "2002-01-16"
  gender:        'male' | 'female' | 'other' | 'prefer_not_to_say'
  city:          string
  blood_group?:  string   // optional e.g. "O+"
}

/** Payload for admin to invite a staff or admin member. */
export interface InviteStaffInput {
  email:        string
  role:         Extract<UserRole, 'hospital_staff' | 'admin'>
  hospital_id?: string    // required when role = 'hospital_staff'
}

// =============================================================================
// BOOKING DTOs — THREE INDEPENDENT MODULES
// NEVER merge these into a single type.
// =============================================================================

/**
 * MODULE 1: Hospital → Doctor appointment booking.
 * Requires: hospital, doctor, slot.
 */
export interface CreateHospitalAppointmentInput {
  module:          'hospital'
  hospital_id:     string
  doctor_id:       string
  slot_id:         string
  fee_amount:      number
  patient_notes?:  string
  chief_complaint?: string
}

/**
 * MODULE 2: Diagnostic → Lab test booking.
 * Requires: hospital (diagnostic centre), service (test).
 * scheduled_at only needed for home collection.
 */
export interface CreateDiagnosticAppointmentInput {
  module:          'diagnostic'
  hospital_id:     string
  service_id:      string
  fee_amount:      number
  patient_notes?:  string
  scheduled_at?:   string   // ISO 8601 — for home collection
}

/**
 * MODULE 3: Clinic → Department visit booking.
 * Requires: hospital (clinic), department.
 * doctor_id is optional — may be assigned by staff after booking.
 */
export interface CreateClinicAppointmentInput {
  module:          'clinic'
  hospital_id:     string
  department_id:   string
  doctor_id?:      string
  fee_amount:      number
  patient_notes?:  string
  chief_complaint?: string
  scheduled_at:    string   // ISO 8601 — required for clinic visits
}

/** Discriminated union for all booking creation inputs. */
export type CreateAppointmentInput =
  | CreateHospitalAppointmentInput
  | CreateDiagnosticAppointmentInput
  | CreateClinicAppointmentInput

/** Staff action to update appointment status. */
export interface UpdateAppointmentStatusInput {
  status:               AppointmentStatus
  staff_notes?:         string
  cancellation_reason?: string
}

// =============================================================================
// PAYMENT DTOs
// =============================================================================

/** Request to create a Razorpay order for an appointment. */
export interface CreateOrderInput {
  appointment_id: string
  amount:         number
  currency?:      string               // defaults to 'INR'
  notes?:         Record<string, string>
}

/**
 * Razorpay payment verification payload.
 * Sent by client after Razorpay checkout completes.
 * Server verifies HMAC signature before marking order paid.
 */
export interface RazorpayVerifyInput {
  razorpay_order_id:   string
  razorpay_payment_id: string
  razorpay_signature:  string
}

/** Request to initiate a refund for a cancelled appointment. */
export interface CreateRefundInput {
  order_id:       string
  appointment_id: string
  amount:         number
  reason:         string
}

/** Admin action to review (approve/reject) a refund request. */
export interface ReviewRefundInput {
  status:       Extract<RefundStatus, 'approved' | 'rejected'>
  admin_notes?: string
}

// =============================================================================
// PAYOUT DTOs
// =============================================================================

/** Admin request to create a weekly hospital payout batch. */
export interface CreatePayoutInput {
  hospital_id:  string
  period_start: string   // ISO date e.g. "2025-03-01"
  period_end:   string   // ISO date e.g. "2025-03-07"
  notes?:       string
}

/** Admin action to update payout status. */
export interface UpdatePayoutStatusInput {
  status:          Extract<PayoutStatus, 'processing' | 'completed' | 'failed' | 'on_hold'>
  razorpay_payout_id?: string
  failure_reason?: string
}

// =============================================================================
// HOSPITAL MANAGEMENT DTOs
// =============================================================================

/** Public registration form for a new hospital / diagnostic centre / clinic. */
export interface RegisterHospitalInput {
  module:        BookingModule
  name:          string
  email:         string
  phone:         string
  address_line1: string
  address_line2?: string
  city:          string
  state:         string
  pincode:       string
  website?:      string
  description?:  string
}

/** Admin approval/rejection of a hospital registration. */
export interface ReviewHospitalInput {
  status:  'approved' | 'rejected' | 'suspended'
  notes?:  string
}

// =============================================================================
// PAGINATION / FILTER DTOs
// Standard shapes for list endpoints.
// =============================================================================

export interface PaginationParams {
  page:     number   // 1-based
  per_page: number   // max 100
}

export interface AppointmentFilters {
  module?:     BookingModule
  status?:     AppointmentStatus
  hospital_id?: string
  doctor_id?:  string
  date_from?:  string   // ISO date
  date_to?:    string   // ISO date
}

export interface PaginatedResult<T> {
  data:        T[]
  total:       number
  page:        number
  per_page:    number
  total_pages: number
}