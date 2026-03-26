'use client'

/**
 * app/(patient)/book/confirm/_components/ConfirmClient.tsx
 *
 * Client Component — renders the full booking confirmation UI.
 *
 * Shows:
 *   - Hospital info
 *   - Doctor info + "Change Doctor" link
 *   - Selected slot date/time + "Change Slot" link
 *   - Patient name + editable phone number
 *   - Consultation fee
 *   - Pay button (wired to Razorpay in next session)
 */

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin, Stethoscope, Calendar, Clock,
  User, Phone, ChevronLeft, Pencil, Check, AlertCircle,
} from 'lucide-react'
import type { SlotDetail, DoctorDetail } from '@/lib/booking/hospital'

// =============================================================================
// PROPS
// =============================================================================

interface HospitalInfo {
  id:       string
  name:     string
  slug:     string
  logo_url: string | null
  city:     string
  state:    string
}

interface PatientInfo {
  id:            string
  full_name:     string
  phone:         string
  date_of_birth: string | null
  gender:        string | null
}

interface Props {
  slot:     SlotDetail
  doctor:   DoctorDetail
  hospital: HospitalInfo
  patient:  PatientInfo
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function ConfirmClient({ slot, doctor, hospital, patient }: Props) {
  const [phone, setPhone]         = useState(patient.phone)
  const [editingPhone, setEditingPhone] = useState(!patient.phone)
  const [phoneError, setPhoneError]     = useState('')

  // Format slot times in IST
  const slotDate = formatDate(slot.slot_start)
  const slotTime = `${formatTime(slot.slot_start)} – ${formatTime(slot.slot_end)}`

  // Back links
  const changeSlotHref   = `/hospitals/${hospital.slug}/book/${doctor.id}`
  const changeDoctorHref = `/hospitals/${hospital.slug}`

  function handlePhoneSave() {
    const cleaned = phone.replace(/\s/g, '')
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setPhoneError('Enter a valid 10-digit Indian mobile number.')
      return
    }
    setPhoneError('')
    setPhone(cleaned)
    setEditingPhone(false)
  }

  function handlePay() {
    // Validate phone before allowing payment
    const cleaned = phone.replace(/\s/g, '')
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setEditingPhone(true)
      setPhoneError('Please enter a valid phone number before paying.')
      return
    }
    // Payment wired in next session
    alert('Razorpay integration coming next session!')
  }

  return (
    <div className="confirm-shell">

      {/* Back link */}
      <Link href={changeSlotHref} className="confirm-back">
        <ChevronLeft size={16} />
        Back to slot picker
      </Link>

      <h1 className="confirm-title">Confirm your booking</h1>
      <p className="confirm-sub">Review your details before paying</p>

      <div className="confirm-card">

        {/* ── Hospital ── */}
        <div className="confirm-section">
          <div className="confirm-row">
            <div className="confirm-icon-wrap">
              {hospital.logo_url ? (
                <Image
                  src={hospital.logo_url}
                  alt={hospital.name}
                  width={40}
                  height={40}
                  className="confirm-logo"
                />
              ) : (
                <div className="confirm-logo-placeholder">
                  {hospital.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="confirm-info">
              <p className="confirm-label">Hospital</p>
              <p className="confirm-value">{hospital.name}</p>
              <p className="confirm-meta">
                <MapPin size={11} />
                {hospital.city}, {hospital.state}
              </p>
            </div>
          </div>
        </div>

        <div className="confirm-divider" />

        {/* ── Doctor ── */}
        <div className="confirm-section">
          <div className="confirm-row">
            <div className="confirm-icon-wrap">
              {doctor.photo_url ? (
                <Image
                  src={doctor.photo_url}
                  alt={doctor.full_name}
                  width={40}
                  height={40}
                  className="confirm-logo confirm-logo--round"
                />
              ) : (
                <div className="confirm-logo-placeholder confirm-logo-placeholder--round">
                  {doctor.full_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="confirm-info">
              <p className="confirm-label">Doctor</p>
              <p className="confirm-value">{doctor.full_name}</p>
              <p className="confirm-meta">
                <Stethoscope size={11} />
                {doctor.specialisation}
                {doctor.department && ` · ${doctor.department.name}`}
                {` · ${doctor.experience_years} yrs exp`}
              </p>
            </div>
            <Link href={changeDoctorHref} className="confirm-change-btn">
              Change
            </Link>
          </div>
        </div>

        <div className="confirm-divider" />

        {/* ── Slot ── */}
        <div className="confirm-section">
          <div className="confirm-row">
            <div className="confirm-icon-wrap confirm-icon-wrap--teal">
              <Calendar size={18} className="confirm-icon" />
            </div>
            <div className="confirm-info">
              <p className="confirm-label">Date &amp; Time</p>
              <p className="confirm-value">{slotDate}</p>
              <p className="confirm-meta">
                <Clock size={11} />
                {slotTime} IST
              </p>
            </div>
            <Link href={changeSlotHref} className="confirm-change-btn">
              Change
            </Link>
          </div>
        </div>

        <div className="confirm-divider" />

        {/* ── Patient details ── */}
        <div className="confirm-section">
          <p className="confirm-section-title">Your details</p>

          {/* Name — read only */}
          <div className="confirm-field">
            <div className="confirm-field-icon">
              <User size={14} />
            </div>
            <div className="confirm-field-body">
              <p className="confirm-field-label">Name</p>
              <p className="confirm-field-value">{patient.full_name}</p>
            </div>
          </div>

          {/* Phone — editable */}
          <div className="confirm-field">
            <div className="confirm-field-icon">
              <Phone size={14} />
            </div>
            <div className="confirm-field-body">
              <p className="confirm-field-label">Mobile number</p>
              {editingPhone ? (
                <div className="phone-edit-row">
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setPhoneError('') }}
                    placeholder="98765 43210"
                    className="phone-input"
                    maxLength={10}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="phone-save-btn"
                    onClick={handlePhoneSave}
                  >
                    <Check size={14} />
                    Save
                  </button>
                </div>
              ) : (
                <div className="phone-view-row">
                  <p className="confirm-field-value">{phone || '—'}</p>
                  <button
                    type="button"
                    className="phone-edit-icon"
                    onClick={() => setEditingPhone(true)}
                    aria-label="Edit phone number"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}
              {phoneError && (
                <p className="phone-error">
                  <AlertCircle size={12} />
                  {phoneError}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="confirm-divider" />

        {/* ── Fee + Pay ── */}
        <div className="confirm-section confirm-fee-section">
          <div className="confirm-fee-row">
            <div>
              <p className="confirm-label">Consultation fee</p>
              <p className="confirm-fee-amount">
                ₹{doctor.consultation_fee.toLocaleString('en-IN')}
              </p>
            </div>
            <button
              type="button"
              className="confirm-pay-btn"
              onClick={handlePay}
            >
              Pay ₹{doctor.consultation_fee.toLocaleString('en-IN')} →
            </button>
          </div>

          <p className="confirm-note">
            You will be redirected to a secure payment gateway.
            Your slot is not confirmed until payment is complete.
          </p>
        </div>

      </div>

      <style>{`
        .confirm-shell {
          max-width: 560px;
          margin: 0 auto;
          padding-bottom: 48px;
        }

        .confirm-back {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: var(--myop-muted);
          text-decoration: none;
          margin-bottom: 20px;
          transition: color 0.15s;
        }
        .confirm-back:hover { color: var(--myop-teal); }

        .confirm-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--myop-slate);
          letter-spacing: -0.4px;
          margin-bottom: 4px;
        }
        .confirm-sub {
          font-size: 14px;
          color: var(--myop-muted);
          margin-bottom: 24px;
        }

        .confirm-card {
          background: #fff;
          border: 1.5px solid var(--myop-border);
          border-radius: 16px;
          overflow: hidden;
        }

        .confirm-section {
          padding: 20px;
        }
        .confirm-section-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--myop-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 14px;
        }

        .confirm-divider {
          height: 1px;
          background: var(--myop-border);
          margin: 0;
        }

        .confirm-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .confirm-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .confirm-icon-wrap--teal { background: #f0fdfa; }
        .confirm-icon { color: var(--myop-teal); }

        .confirm-logo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .confirm-logo--round { border-radius: 50%; }

        .confirm-logo-placeholder {
          font-size: 18px;
          font-weight: 700;
          color: var(--myop-teal);
        }
        .confirm-logo-placeholder--round {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f0fdfa;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .confirm-info { flex: 1; min-width: 0; }
        .confirm-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--myop-muted);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 2px;
        }
        .confirm-value {
          font-size: 15px;
          font-weight: 700;
          color: var(--myop-slate);
          margin-bottom: 2px;
        }
        .confirm-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--myop-muted);
        }

        .confirm-change-btn {
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 600;
          color: var(--myop-teal);
          text-decoration: none;
          padding: 4px 10px;
          border: 1px solid var(--myop-teal);
          border-radius: 6px;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .confirm-change-btn:hover { background: #f0fdfa; }

        /* Patient fields */
        .confirm-field {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }
        .confirm-field:last-child { margin-bottom: 0; }

        .confirm-field-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid var(--myop-border);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--myop-muted);
          margin-top: 2px;
        }

        .confirm-field-body { flex: 1; }
        .confirm-field-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--myop-muted);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 3px;
        }
        .confirm-field-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--myop-slate);
        }

        /* Phone editing */
        .phone-view-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .phone-edit-icon {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--myop-muted);
          padding: 2px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .phone-edit-icon:hover { color: var(--myop-teal); }

        .phone-edit-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .phone-input {
          flex: 1;
          height: 36px;
          padding: 0 10px;
          border: 1.5px solid var(--myop-teal);
          border-radius: 6px;
          font-size: 14px;
          color: var(--myop-slate);
          outline: none;
          max-width: 200px;
        }
        .phone-save-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          height: 36px;
          padding: 0 12px;
          background: var(--myop-teal);
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .phone-save-btn:hover { background: var(--myop-teal-dark); }

        .phone-error {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #ef4444;
          margin-top: 4px;
        }

        /* Fee + Pay */
        .confirm-fee-section { background: #fafafa; }
        .confirm-fee-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 12px;
        }
        .confirm-fee-amount {
          font-size: 24px;
          font-weight: 800;
          color: var(--myop-slate);
          letter-spacing: -0.5px;
        }
        .confirm-pay-btn {
          height: 48px;
          padding: 0 28px;
          background: var(--myop-teal);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .confirm-pay-btn:hover {
          background: var(--myop-teal-dark);
          transform: translateY(-1px);
        }
        .confirm-note {
          font-size: 12px;
          color: var(--myop-muted);
          line-height: 1.5;
        }
      `}</style>
    </div>
  )
}

// =============================================================================
// HELPERS
// =============================================================================

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
    timeZone: 'Asia/Kolkata',
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday:  'long',
    day:      'numeric',
    month:    'long',
    year:     'numeric',
    timeZone: 'Asia/Kolkata',
  })
}