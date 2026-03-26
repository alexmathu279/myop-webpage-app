/**
 * types/index.ts
 * MYOP Healthcare Marketplace
 *
 * BARREL EXPORT — single import point for all types.
 *
 * Three-layer type architecture:
 *   database.ts  → DB schema mirror (Row/Insert/Update + Database map)
 *   domain.ts    → Business entities, privacy views, join shapes, auth context
 *   dto.ts       → Server action payloads, API requests/responses
 *
 * Usage:
 *   import type { UserProfile, ActionResult, CreateHospitalAppointmentInput } from '@/types'
 *
 * If you need the raw Database type for createClient<Database>():
 *   import type { Database } from '@/types'   ← re-exported below
 */

// Database layer — re-export Database for Supabase client generics
export type { Database } from './database'

// Also export raw row types and enums for edge cases that need them directly
export type {
  UserRoleEnum,
  BookingModuleEnum,
  AppointmentStatusEnum,
  OrderStatusEnum,
  PayoutStatusEnum,
  RefundStatusEnum,
  NotificationChannelEnum,
  NotificationStatusEnum,
  ApprovalStatusEnum,
  GenderEnum,
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
} from './database'

// Domain layer — business entities and join shapes
export type {
  UserRole,
  BookingModule,
  AppointmentStatus,
  OrderStatus,
  PayoutStatus,
  RefundStatus,
  NotificationChannel,
  NotificationStatus,
  ApprovalStatus,
  Gender,
  UserProfile,
  PatientProfile,
  Hospital,
  HospitalStaff,
  Department,
  Doctor,
  DoctorSchedule,
  AppointmentSlot,
  Service,
  Appointment,
  Order,
  Refund,
  Payout,
  PayoutItem,
  Conversation,
  ChatMessage,
  Notification,
  AuditLog,
  AppointmentPublic,
  DoctorWithHospital,
  AppointmentWithDetails,
  AppointmentForStaff,
  ServiceWithHospital,
  SlotWithDoctor,
  PayoutWithItems,
  AuthUser,
  UserIdentity,
} from './domain'

// DTO layer — server action payloads, API shapes
export type {
  ActionResult,
  SignUpInput,
  SignInInput,
  AcceptInviteInput,
  OnboardingInput,
  InviteStaffInput,
  CreateHospitalAppointmentInput,
  CreateDiagnosticAppointmentInput,
  CreateClinicAppointmentInput,
  CreateAppointmentInput,
  UpdateAppointmentStatusInput,
  CreateOrderInput,
  RazorpayVerifyInput,
  CreateRefundInput,
  ReviewRefundInput,
  CreatePayoutInput,
  UpdatePayoutStatusInput,
  RegisterHospitalInput,
  ReviewHospitalInput,
  PaginationParams,
  AppointmentFilters,
  PaginatedResult,
} from './dto'