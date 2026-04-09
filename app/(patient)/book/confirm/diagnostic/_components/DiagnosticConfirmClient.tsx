'use client'

/**
 * app/(patient)/book/confirm/diagnostic/_components/DiagnosticConfirmClient.tsx
 *
 * Shows:
 *   - Centre info
 *   - Selected tests list with prices
 *   - Collection type (walk-in / home)
 *   - Booking date
 *   - Patient name + editable phone + editable address (for home collection)
 *   - Total fee
 *   - Pay button (Razorpay wired in next session)
 */

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin, FlaskConical, Calendar, Home, Building2,
  User, Phone, ChevronLeft, Pencil, Check, AlertCircle, MapPinned,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DiagnosticService } from '@/lib/booking/diagnostic'

interface CentreInfo {
  id:       string
  name:     string
  slug:     string
  logo_url: string | null
  city:     string
  state:    string
  phone:    string
  address:  string
}

interface PatientInfo {
  id:        string
  full_name: string
  phone:     string
  address:   string
  city:      string
}

interface Props {
  centre:         CentreInfo
  services:       DiagnosticService[]
  collectionType: 'walkin' | 'home'
  bookingDate:    string   // 'YYYY-MM-DD'
  totalPrice:     number
  patient:        PatientInfo
}

export default function DiagnosticConfirmClient({
  centre,
  services,
  collectionType,
  bookingDate,
  totalPrice,
  patient,
}: Props) {
  const [phone,         setPhone]         = useState(patient.phone)
  const [address,       setAddress]       = useState(patient.address)
  const [editingPhone,  setEditingPhone]  = useState(!patient.phone)
  const [editingAddress, setEditingAddress] = useState(collectionType === 'home' && !patient.address)
  const [phoneError,    setPhoneError]    = useState('')
  const [addressError,  setAddressError]  = useState('')

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

  function handleAddressSave() {
    if (address.trim().length < 10) {
      setAddressError('Please enter a complete address.')
      return
    }
    setAddressError('')
    setEditingAddress(false)
  }

  function handlePay() {
    const cleaned = phone.replace(/\s/g, '')
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setEditingPhone(true)
      setPhoneError('Please enter a valid phone number before paying.')
      return
    }
    if (collectionType === 'home' && address.trim().length < 10) {
      setEditingAddress(true)
      setAddressError('Please enter your collection address before paying.')
      return
    }
    // Payment wired in next session
    alert('Razorpay integration coming next session!')
  }

  const formattedDate = new Date(`${bookingDate}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="confirm-shell">
      <Link href={`/book/diagnostic/${centre.slug}`} className="confirm-back">
        <ChevronLeft size={16} />
        Back to {centre.name}
      </Link>

      <h1 className="confirm-title">Confirm your booking</h1>
      <p className="confirm-sub">Review your tests and details before paying</p>

      <div className="confirm-card">

        {/* ── Centre ── */}
        <div className="confirm-section">
          <div className="confirm-row">
            <div className="confirm-icon-wrap">
              {centre.logo_url ? (
                <Image src={centre.logo_url} alt={centre.name} width={40} height={40} className="confirm-logo" />
              ) : (
                <div className="confirm-logo-placeholder">{centre.name.charAt(0)}</div>
              )}
            </div>
            <div className="confirm-info">
              <p className="confirm-label">Diagnostic Centre</p>
              <p className="confirm-value">{centre.name}</p>
              <p className="confirm-meta">
                <MapPin size={11} />
                {centre.city}, {centre.state}
              </p>
            </div>
          </div>
        </div>

        <div className="confirm-divider" />

        {/* ── Tests selected ── */}
        <div className="confirm-section">
          <p className="confirm-section-title">
            <FlaskConical size={13} className="inline mr-1" />
            Selected Tests ({services.length})
          </p>
          <div className="tests-list">
            {services.map((s) => (
              <div key={s.id} className="test-row">
                <div className="flex-1">
                  <p className="test-name">{s.name}</p>
                  {s.preparation && (
                    <p className="test-prep">⚠ {s.preparation}</p>
                  )}
                  {s.report_tat_hrs && (
                    <p className="test-tat">Report in {s.report_tat_hrs}h</p>
                  )}
                </div>
                <p className="test-price">₹{s.price.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="confirm-divider" />

        {/* ── Collection type + date ── */}
        <div className="confirm-section">
          <div className="confirm-row">
            <div className={cn('confirm-icon-wrap', collectionType === 'home' ? 'confirm-icon-wrap--green' : 'confirm-icon-wrap--cyan')}>
              {collectionType === 'home'
                ? <Home size={18} className="confirm-icon" />
                : <Building2 size={18} className="confirm-icon" />
              }
            </div>
            <div className="confirm-info">
              <p className="confirm-label">Collection Type</p>
              <p className="confirm-value">
                {collectionType === 'home' ? 'Home Collection' : 'Walk-in at Centre'}
              </p>
            </div>
          </div>

          <div className="confirm-row" style={{ marginTop: 16 }}>
            <div className="confirm-icon-wrap confirm-icon-wrap--cyan">
              <Calendar size={18} className="confirm-icon" />
            </div>
            <div className="confirm-info">
              <p className="confirm-label">Date</p>
              <p className="confirm-value">{formattedDate}</p>
            </div>
            <Link href={`/book/diagnostic/${centre.slug}`} className="confirm-change-btn">
              Change
            </Link>
          </div>
        </div>

        <div className="confirm-divider" />

        {/* ── Patient details ── */}
        <div className="confirm-section">
          <p className="confirm-section-title">Your details</p>

          {/* Name */}
          <div className="confirm-field">
            <div className="confirm-field-icon"><User size={14} /></div>
            <div className="confirm-field-body">
              <p className="confirm-field-label">Name</p>
              <p className="confirm-field-value">{patient.full_name}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="confirm-field">
            <div className="confirm-field-icon"><Phone size={14} /></div>
            <div className="confirm-field-body">
              <p className="confirm-field-label">Mobile number</p>
              {editingPhone ? (
                <div className="phone-edit-row">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setPhoneError('') }}
                    placeholder="98765 43210"
                    className="phone-input"
                    maxLength={10}
                    autoFocus
                  />
                  <button type="button" className="phone-save-btn" onClick={handlePhoneSave}>
                    <Check size={14} /> Save
                  </button>
                </div>
              ) : (
                <div className="phone-view-row">
                  <p className="confirm-field-value">{phone || '—'}</p>
                  <button type="button" className="phone-edit-icon" onClick={() => setEditingPhone(true)}>
                    <Pencil size={13} />
                  </button>
                </div>
              )}
              {phoneError && <p className="phone-error"><AlertCircle size={12} />{phoneError}</p>}
            </div>
          </div>

          {/* Address — only for home collection */}
          {collectionType === 'home' && (
            <div className="confirm-field">
              <div className="confirm-field-icon"><MapPinned size={14} /></div>
              <div className="confirm-field-body">
                <p className="confirm-field-label">Collection address</p>
                {editingAddress ? (
                  <div className="address-edit-wrap">
                    <textarea
                      value={address}
                      onChange={(e) => { setAddress(e.target.value); setAddressError('') }}
                      placeholder="House/flat number, street, area, city, pincode"
                      className="address-input"
                      rows={3}
                      autoFocus
                    />
                    <button type="button" className="phone-save-btn" onClick={handleAddressSave}>
                      <Check size={14} /> Save
                    </button>
                  </div>
                ) : (
                  <div className="phone-view-row" style={{ alignItems: 'flex-start' }}>
                    <p className="confirm-field-value" style={{ whiteSpace: 'pre-wrap' }}>
                      {address || '—'}
                    </p>
                    <button type="button" className="phone-edit-icon" onClick={() => setEditingAddress(true)}>
                      <Pencil size={13} />
                    </button>
                  </div>
                )}
                {addressError && <p className="phone-error"><AlertCircle size={12} />{addressError}</p>}
              </div>
            </div>
          )}
        </div>

        <div className="confirm-divider" />

        {/* ── Total + Pay ── */}
        <div className="confirm-section confirm-fee-section">
          <div className="confirm-fee-row">
            <div>
              <p className="confirm-label">Total amount</p>
              <p className="confirm-fee-amount">₹{totalPrice.toLocaleString('en-IN')}</p>
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                {services.length} test{services.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button type="button" className="confirm-pay-btn" onClick={handlePay}>
              Pay ₹{totalPrice.toLocaleString('en-IN')} →
            </button>
          </div>
          <p className="confirm-note">
            You will be redirected to a secure payment gateway.
          </p>
        </div>
      </div>

      <style>{`
        .confirm-shell { max-width: 560px; margin: 0 auto; padding-bottom: 48px; }
        .confirm-back { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: var(--myop-muted); text-decoration: none; margin-bottom: 20px; transition: color 0.15s; }
        .confirm-back:hover { color: #0891b2; }
        .confirm-title { font-size: 22px; font-weight: 800; color: var(--myop-slate); letter-spacing: -0.4px; margin-bottom: 4px; }
        .confirm-sub { font-size: 14px; color: var(--myop-muted); margin-bottom: 24px; }
        .confirm-card { background: #fff; border: 1.5px solid var(--myop-border); border-radius: 16px; overflow: hidden; }
        .confirm-section { padding: 20px; }
        .confirm-section-title { font-size: 12px; font-weight: 700; color: var(--myop-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; display: flex; align-items: center; }
        .confirm-divider { height: 1px; background: var(--myop-border); }
        .confirm-row { display: flex; align-items: center; gap: 14px; }
        .confirm-icon-wrap { width: 40px; height: 40px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
        .confirm-icon-wrap--cyan { background: #ecfeff; }
        .confirm-icon-wrap--green { background: #f0fdf4; }
        .confirm-icon { color: #0891b2; }
        .confirm-logo { width: 100%; height: 100%; object-fit: cover; }
        .confirm-logo-placeholder { font-size: 18px; font-weight: 700; color: #0891b2; }
        .confirm-info { flex: 1; min-width: 0; }
        .confirm-label { font-size: 11px; font-weight: 600; color: var(--myop-muted); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 2px; }
        .confirm-value { font-size: 15px; font-weight: 700; color: var(--myop-slate); margin-bottom: 2px; }
        .confirm-meta { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--myop-muted); }
        .confirm-change-btn { flex-shrink: 0; font-size: 12px; font-weight: 600; color: #0891b2; text-decoration: none; padding: 4px 10px; border: 1px solid #0891b2; border-radius: 6px; transition: background 0.15s; white-space: nowrap; }
        .confirm-change-btn:hover { background: #ecfeff; }
        .tests-list { display: flex; flex-direction: column; gap: 10px; }
        .test-row { display: flex; align-items: flex-start; gap: 12px; padding: 10px 12px; background: #f8fafc; border-radius: 10px; }
        .test-name { font-size: 14px; font-weight: 600; color: var(--myop-slate); }
        .test-prep { font-size: 11px; color: #d97706; margin-top: 2px; }
        .test-tat { font-size: 11px; color: var(--myop-muted); margin-top: 1px; }
        .test-price { font-size: 14px; font-weight: 700; color: var(--myop-slate); white-space: nowrap; }
        .confirm-field { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
        .confirm-field:last-child { margin-bottom: 0; }
        .confirm-field-icon { width: 30px; height: 30px; border-radius: 8px; background: #f8fafc; border: 1px solid var(--myop-border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--myop-muted); margin-top: 2px; }
        .confirm-field-body { flex: 1; }
        .confirm-field-label { font-size: 11px; font-weight: 600; color: var(--myop-muted); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 3px; }
        .confirm-field-value { font-size: 14px; font-weight: 600; color: var(--myop-slate); }
        .phone-view-row { display: flex; align-items: center; gap: 8px; }
        .phone-edit-icon { background: none; border: none; cursor: pointer; color: var(--myop-muted); padding: 2px; display: flex; align-items: center; transition: color 0.15s; }
        .phone-edit-icon:hover { color: #0891b2; }
        .phone-edit-row { display: flex; align-items: center; gap: 8px; }
        .phone-input { flex: 1; height: 36px; padding: 0 10px; border: 1.5px solid #0891b2; border-radius: 6px; font-size: 14px; color: var(--myop-slate); outline: none; max-width: 200px; }
        .address-edit-wrap { display: flex; flex-direction: column; gap: 8px; }
        .address-input { width: 100%; padding: 8px 10px; border: 1.5px solid #0891b2; border-radius: 6px; font-size: 14px; color: var(--myop-slate); outline: none; resize: vertical; }
        .phone-save-btn { display: flex; align-items: center; gap: 4px; height: 36px; padding: 0 12px; background: #0891b2; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
        .phone-save-btn:hover { background: #0e7490; }
        .phone-error { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #ef4444; margin-top: 4px; }
        .confirm-fee-section { background: #fafafa; }
        .confirm-fee-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
        .confirm-fee-amount { font-size: 24px; font-weight: 800; color: var(--myop-slate); letter-spacing: -0.5px; }
        .confirm-pay-btn { height: 48px; padding: 0 28px; background: #0891b2; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.15s, transform 0.1s; white-space: nowrap; flex-shrink: 0; }
        .confirm-pay-btn:hover { background: #0e7490; transform: translateY(-1px); }
        .confirm-note { font-size: 12px; color: var(--myop-muted); line-height: 1.5; }
      `}</style>
    </div>
  )
}