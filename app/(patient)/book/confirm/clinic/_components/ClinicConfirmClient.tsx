'use client'

/**
 * app/(patient)/book/confirm/clinic/_components/ClinicConfirmClient.tsx
 */

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin, Stethoscope, Calendar,
  User, Phone, ChevronLeft, Pencil, Check, AlertCircle,
} from 'lucide-react'

interface Props {
  clinic: { id: string; name: string; slug: string; logo_url: string | null; city: string; state: string }
  dept:   { id: string; name: string; fee: number | null }
  bookingDate: string
  patient: { id: string; full_name: string; phone: string }
}

export default function ClinicConfirmClient({ clinic, dept, bookingDate, patient }: Props) {
  const [phone,        setPhone]        = useState(patient.phone)
  const [editingPhone, setEditingPhone] = useState(!patient.phone)
  const [phoneError,   setPhoneError]   = useState('')

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
    const cleaned = phone.replace(/\s/g, '')
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setEditingPhone(true)
      setPhoneError('Please enter a valid phone number before paying.')
      return
    }
    alert('Razorpay integration coming next session!')
  }

  const formattedDate = new Date(`${bookingDate}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  })

  return (
    <div className="confirm-shell">
      <Link href={`/book/clinic/${clinic.slug}`} className="confirm-back">
        <ChevronLeft size={16} />Back to {clinic.name}
      </Link>

      <h1 className="confirm-title">Confirm your appointment</h1>
      <p className="confirm-sub">Review your details before paying</p>

      <div className="confirm-card">

        {/* Clinic */}
        <div className="confirm-section">
          <div className="confirm-row">
            <div className="confirm-icon-wrap">
              {clinic.logo_url
                ? <Image src={clinic.logo_url} alt={clinic.name} width={40} height={40} className="confirm-logo" />
                : <div className="confirm-logo-placeholder">{clinic.name.charAt(0)}</div>
              }
            </div>
            <div className="confirm-info">
              <p className="confirm-label">Clinic</p>
              <p className="confirm-value">{clinic.name}</p>
              <p className="confirm-meta"><MapPin size={11} />{clinic.city}, {clinic.state}</p>
            </div>
          </div>
        </div>

        <div className="confirm-divider" />

        {/* Department */}
        <div className="confirm-section">
          <div className="confirm-row">
            <div className="confirm-icon-wrap confirm-icon-wrap--violet">
              <Stethoscope size={18} className="confirm-icon" />
            </div>
            <div className="confirm-info">
              <p className="confirm-label">Department</p>
              <p className="confirm-value">{dept.name}</p>
              <p className="confirm-meta">Walk-in appointment</p>
            </div>
          </div>
        </div>

        <div className="confirm-divider" />

        {/* Date */}
        <div className="confirm-section">
          <div className="confirm-row">
            <div className="confirm-icon-wrap confirm-icon-wrap--violet">
              <Calendar size={18} className="confirm-icon" />
            </div>
            <div className="confirm-info">
              <p className="confirm-label">Visit Date</p>
              <p className="confirm-value">{formattedDate}</p>
            </div>
            <Link href={`/book/clinic/${clinic.slug}`} className="confirm-change-btn">Change</Link>
          </div>
        </div>

        <div className="confirm-divider" />

        {/* Patient */}
        <div className="confirm-section">
          <p className="confirm-section-title">Your details</p>

          <div className="confirm-field">
            <div className="confirm-field-icon"><User size={14} /></div>
            <div className="confirm-field-body">
              <p className="confirm-field-label">Name</p>
              <p className="confirm-field-value">{patient.full_name}</p>
            </div>
          </div>

          <div className="confirm-field">
            <div className="confirm-field-icon"><Phone size={14} /></div>
            <div className="confirm-field-body">
              <p className="confirm-field-label">Mobile number</p>
              {editingPhone ? (
                <div className="phone-edit-row">
                  <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setPhoneError('') }} placeholder="98765 43210" className="phone-input" maxLength={10} autoFocus />
                  <button type="button" className="phone-save-btn" onClick={handlePhoneSave}><Check size={14} />Save</button>
                </div>
              ) : (
                <div className="phone-view-row">
                  <p className="confirm-field-value">{phone || '—'}</p>
                  <button type="button" className="phone-edit-icon" onClick={() => setEditingPhone(true)}><Pencil size={13} /></button>
                </div>
              )}
              {phoneError && <p className="phone-error"><AlertCircle size={12} />{phoneError}</p>}
            </div>
          </div>
        </div>

        <div className="confirm-divider" />

        {/* Fee + Pay */}
        <div className="confirm-section confirm-fee-section">
          <div className="confirm-fee-row">
            <div>
              <p className="confirm-label">Consultation fee</p>
              <p className="confirm-fee-amount">
                {dept.fee !== null ? `₹${dept.fee.toLocaleString('en-IN')}` : 'To be confirmed'}
              </p>
            </div>
            {dept.fee !== null && (
              <button type="button" className="confirm-pay-btn" onClick={handlePay}>
                Pay ₹{dept.fee.toLocaleString('en-IN')} →
              </button>
            )}
          </div>
          <p className="confirm-note">You will be redirected to a secure payment gateway.</p>
        </div>
      </div>

      <style>{`
        .confirm-shell { max-width: 560px; margin: 0 auto; padding-bottom: 48px; }
        .confirm-back { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--myop-muted); text-decoration: none; margin-bottom: 20px; transition: color 0.15s; }
        .confirm-back:hover { color: #7c3aed; }
        .confirm-title { font-size: 22px; font-weight: 800; color: var(--myop-slate); letter-spacing: -0.4px; margin-bottom: 4px; }
        .confirm-sub { font-size: 14px; color: var(--myop-muted); margin-bottom: 24px; }
        .confirm-card { background: #fff; border: 1.5px solid var(--myop-border); border-radius: 16px; overflow: hidden; }
        .confirm-section { padding: 20px; }
        .confirm-section-title { font-size: 12px; font-weight: 700; color: var(--myop-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; }
        .confirm-divider { height: 1px; background: var(--myop-border); }
        .confirm-row { display: flex; align-items: center; gap: 14px; }
        .confirm-icon-wrap { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
        .confirm-icon-wrap--violet { background: #f5f3ff; }
        .confirm-icon { color: #7c3aed; }
        .confirm-logo { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; }
        .confirm-logo-placeholder { font-size: 18px; font-weight: 700; color: #7c3aed; }
        .confirm-info { flex: 1; min-width: 0; }
        .confirm-label { font-size: 11px; font-weight: 600; color: var(--myop-muted); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px; }
        .confirm-value { font-size: 15px; font-weight: 700; color: var(--myop-slate); margin-bottom: 2px; }
        .confirm-meta { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--myop-muted); }
        .confirm-change-btn { flex-shrink: 0; font-size: 12px; font-weight: 600; color: #7c3aed; text-decoration: none; padding: 4px 10px; border: 1px solid #7c3aed; border-radius: 6px; transition: background 0.15s; white-space: nowrap; }
        .confirm-change-btn:hover { background: #f5f3ff; }
        .confirm-field { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
        .confirm-field:last-child { margin-bottom: 0; }
        .confirm-field-icon { width: 30px; height: 30px; border-radius: 8px; background: #f8fafc; border: 1px solid var(--myop-border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--myop-muted); margin-top: 2px; }
        .confirm-field-body { flex: 1; }
        .confirm-field-label { font-size: 11px; font-weight: 600; color: var(--myop-muted); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 3px; }
        .confirm-field-value { font-size: 14px; font-weight: 600; color: var(--myop-slate); }
        .phone-view-row { display: flex; align-items: center; gap: 8px; }
        .phone-edit-icon { background: none; border: none; cursor: pointer; color: var(--myop-muted); padding: 2px; display: flex; align-items: center; transition: color 0.15s; }
        .phone-edit-icon:hover { color: #7c3aed; }
        .phone-edit-row { display: flex; align-items: center; gap: 8px; }
        .phone-input { flex: 1; height: 36px; padding: 0 10px; border: 1.5px solid #7c3aed; border-radius: 6px; font-size: 14px; color: var(--myop-slate); outline: none; max-width: 200px; }
        .phone-save-btn { display: flex; align-items: center; gap: 4px; height: 36px; padding: 0 12px; background: #7c3aed; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .phone-save-btn:hover { background: #6d28d9; }
        .phone-error { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #ef4444; margin-top: 4px; }
        .confirm-fee-section { background: #fafafa; }
        .confirm-fee-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
        .confirm-fee-amount { font-size: 24px; font-weight: 800; color: var(--myop-slate); letter-spacing: -0.5px; }
        .confirm-pay-btn { height: 48px; padding: 0 28px; background: #7c3aed; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.15s, transform 0.1s; white-space: nowrap; flex-shrink: 0; }
        .confirm-pay-btn:hover { background: #6d28d9; transform: translateY(-1px); }
        .confirm-note { font-size: 12px; color: var(--myop-muted); line-height: 1.5; }
      `}</style>
    </div>
  )
}