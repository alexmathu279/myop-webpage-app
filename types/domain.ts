/**
 * types/domain.ts
 * MYOP Healthcare Marketplace
 *
 * DOMAIN TYPES — Layer 2 of 3
 *
 * Business / application types derived from raw DB row types.
 * These are what your React components, server actions, and
 * business logic actually work with.
 *
 * Rules:
 *   - Import raw Row types from ./database, never re-declare fields
 *   - Add computed/derived fields, privacy-filtered views, join shapes
 *   - No HTTP request/response shapes (those live in ./dto)
 *   - No Supabase client logic
 */

import type {
  UserProfileRow,
  PatientProfileRow,
  HospitalRow,
  HospitalStaffRow,
  DepartmentRow,
  DoctorRow,
  DoctorScheduleRow,
  AppointmentSlotRow,
  ServiceRow,
  AppointmentRow,
  OrderRow,
  RefundRow,
  PayoutRow,
  PayoutItemRow,
  ConversationRow,
  ChatMessageRow,
  NotificationRow,
  AuditLogRow,
  UserRoleEnum,
  BookingModuleEnum,
  AppointmentStatusEnum,
} from './database'

// =============================================================================
// RE-EXPORT ENUMS AS CLEAN DOMAIN ALIASES
// Components import from here, not from database.ts
// =============================================================================

export type UserRole            = UserRoleEnum
export type BookingModule       = BookingModuleEnum
export type AppointmentStatus   = AppointmentStatusEnum
export type {
  OrderStatusEnum      as OrderStatus,
  PayoutStatusEnum     as PayoutStatus,
  RefundStatusEnum     as RefundStatus,
  NotificationChannelEnum as NotificationChannel,
  NotificationStatusEnum  as NotificationStatus,
  ApprovalStatusEnum   as ApprovalStatus,
  GenderEnum           as Gender,
} from './database'

// =============================================================================
// DOMAIN ENTITY ALIASES
// Use these in components — they map 1:1 to DB rows but have
// domain-friendly names. When you need extra computed fields,
// extend here rather than modifying database.ts.
// =============================================================================

export type UserProfile      = UserProfileRow
export type PatientProfile   = PatientProfileRow
export type Hospital         = HospitalRow
export type HospitalStaff    = HospitalStaffRow
export type Department       = DepartmentRow
export type Doctor           = DoctorRow
export type DoctorSchedule   = DoctorScheduleRow
export type AppointmentSlot  = AppointmentSlotRow
export type Service          = ServiceRow
export type Appointment      = AppointmentRow
export type Order            = OrderRow
export type Refund           = RefundRow
export type Payout           = PayoutRow
export type PayoutItem       = PayoutItemRow
export type Conversation     = ConversationRow
export type ChatMessage      = ChatMessageRow
export type Notification     = NotificationRow
export type AuditLog         = AuditLogRow

// =============================================================================
// PRIVACY-FILTERED VIEWS
// These types enforce the admin privacy rule at the type level.
// =============================================================================

/**
 * Appointment safe for admin/staff consumption.
 * Strips private patient fields: patient_notes, chief_complaint.
 * Admin MUST NEVER receive these fields — RLS enforces at DB layer,
 * this type enforces at application layer.
 */
export type AppointmentPublic = Omit<Appointment, 'patient_notes' | 'chief_complaint'>

// =============================================================================
// JOIN / COMPOSITE TYPES
// Shapes returned by Supabase .select() with related tables.
// =============================================================================

/** Doctor with their hospital context — used in search results. */
export interface DoctorWithHospital extends Doctor {
  hospital:   Pick<Hospital, 'id' | 'name' | 'slug' | 'city' | 'module'>
  department: Pick<Department, 'id' | 'name'> | null
}

/**
 * Full appointment with all related parties — patient-facing view.
 * Includes private fields (patient sees their own data).
 */
export interface AppointmentWithDetails extends Appointment {
  hospital:   Pick<Hospital, 'id' | 'name' | 'slug' | 'logo_url' | 'city' | 'phone'>
  doctor:     Pick<Doctor, 'id' | 'full_name' | 'specialisation' | 'photo_url'> | null
  service:    Pick<Service, 'id' | 'name' | 'category'> | null
  department: Pick<Department, 'id' | 'name'> | null
  slot:       Pick<AppointmentSlot, 'id' | 'slot_start' | 'slot_end'> | null
  order:      Pick<Order, 'id' | 'status' | 'amount' | 'razorpay_order_id'> | null
}

/**
 * Appointment for hospital staff dashboard.
 * EXCLUDES private patient fields (AppointmentPublic base).
 * Shows patient display name only — no medical details.
 */
export interface AppointmentForStaff extends AppointmentPublic {
  patient:    Pick<UserProfile, 'id' | 'full_name' | 'avatar_url'>
  doctor:     Pick<Doctor, 'id' | 'full_name' | 'specialisation'> | null
  slot:       Pick<AppointmentSlot, 'id' | 'slot_start' | 'slot_end'> | null
}

/**
 * Service with its parent hospital context — used in diagnostic search.
 */
export interface ServiceWithHospital extends Service {
  hospital: Pick<Hospital, 'id' | 'name' | 'slug' | 'city' | 'logo_url'>
}

/**
 * Slot with doctor context — used in booking flow.
 */
export interface SlotWithDoctor extends AppointmentSlot {
  doctor: Pick<Doctor, 'id' | 'full_name' | 'specialisation' | 'photo_url' | 'consultation_fee'>
}

/**
 * Payout with its line items — used in admin payout detail view.
 */
export interface PayoutWithItems extends Payout {
  items: (PayoutItem & {
    appointment: Pick<Appointment, 'id' | 'module' | 'fee_amount' | 'scheduled_at'>
  })[]
}

// =============================================================================
// SESSION / AUTH DOMAIN TYPES
// =============================================================================

/**
 * The authenticated user context available throughout the app.
 * Populated by middleware and passed via React context or server props.
 */
export interface AuthUser {
  id:           string   // Supabase auth.users UUID
  email:        string
  role:         UserRole
  full_name:    string
  avatar_url:   string | null
  is_onboarded: boolean
}

/**
 * Minimal user identity for display purposes (nav bar, avatars, etc.)
 */
export interface UserIdentity {
  id:         string
  full_name:  string
  avatar_url: string | null
  role:       UserRole
}