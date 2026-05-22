/**
 * lib/config.ts
 * MYOP Healthcare Marketplace
 *
 * All application constants in one place.
 * Import from here — never hardcode values in feature files.
 */

// =============================================================================
// PHARMACY
// =============================================================================

export const PHARMACY = {
  /** Cart maximum quantity per product */
  CART_MAX_QTY:            10,
  /** Free delivery threshold in rupees */
  FREE_DELIVERY_THRESHOLD: 500,
  /** Flat delivery fee in rupees when below threshold */
  DELIVERY_FEE:            40,
  /** Product cache revalidation in seconds */
  PRODUCT_CACHE_TTL:       120,
} as const

// =============================================================================
// AMBULANCE
// =============================================================================

export const AMBULANCE = {
  /** Simulated ETA when an ambulance is available (minutes) */
  ETA_AVAILABLE_MINS:   8,
  /** Simulated ETA when no ambulance is immediately available (minutes) */
  ETA_UNAVAILABLE_MINS: 15,
  /** Ambulance list cache revalidation in seconds */
  CACHE_TTL:            30,
  /** Delay before status moves to confirmed (ms) */
  CONFIRM_DELAY_MS:     15_000,
  /** Delay before status moves to on_the_way (ms) */
  ON_THE_WAY_DELAY_MS:  45_000,
  /** Delay before status moves to arrived (ms) */
  ARRIVED_DELAY_MS:     600_000,
} as const

// =============================================================================
// BOOKING / HOSPITAL
// =============================================================================

export const BOOKING = {
  /** Public hospital/clinic/diagnostic query cache TTL in seconds */
  CACHE_TTL:            60,
  /** Slot picker days shown */
  DATE_STRIP_DAYS:      7,
  /** Max days ahead for diagnostic/clinic date picker */
  MAX_BOOKING_DAYS:     30,
  /** Minutes a pending appointment is held before auto-cancel */
  PENDING_TIMEOUT_MINS: 10,
} as const

// =============================================================================
// SEARCH / UI
// =============================================================================

export const UI = {
  /** Debounce delay for search inputs (ms) */
  SEARCH_DEBOUNCE_MS:   350,
  /** Max polling attempts on payment processing page */
  PAYMENT_POLL_MAX:     30,
  /** Payment status poll interval (ms) */
  PAYMENT_POLL_MS:      2_000,
} as const

// =============================================================================
// PAYMENTS

// =============================================================================

export const PAYMENT = {
  CURRENCY: 'INR',
} as const