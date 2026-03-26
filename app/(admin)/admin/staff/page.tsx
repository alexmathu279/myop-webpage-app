/**
 * app/(admin)/admin/staff/page.tsx
 * MYOP Healthcare Marketplace
 *
 * Staff & Invites management page.
 * Admin can invite hospital staff and admin members.
 */

'use client'

import { useActionState, useState, useEffect } from 'react'
import { inviteStaffMember } from '@/lib/auth/actions'
import type { ActionResult } from '@/types/dto'

const initialState: ActionResult = { success: true, data: undefined }

export default function AdminStaffPage() {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    inviteStaffMember,
    initialState,
  )

  const [hospitals, setHospitals] = useState<{ id: string; name: string; module: string }[]>([])
  const [selectedRole, setSelectedRole] = useState<string>('hospital_staff')
  const [formKey, setFormKey] = useState(0)

  // Fetch approved hospitals for the dropdown
  useEffect(() => {
    fetch('/api/admin/hospitals/list')
      .then(r => r.json())
      .then(data => setHospitals(data ?? []))
      .catch(() => {})
  }, [])

  // Reset form on success
  useEffect(() => {
    if (state.success && state !== initialState) {
      setFormKey(k => k + 1)
    }
  }, [state])

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Staff & Invites</h1>
        <p className="page-sub">
          Invite hospital staff or admin members. They will receive an email to set up their account.
        </p>
      </div>

      <div className="content-grid">
        {/* Invite form */}
        <section className="card">
          <h2 className="card__title">Send an invite</h2>

          {state.success && state !== initialState && (
            <div className="alert alert--success">
              ✓ Invite sent successfully. The user will receive an email shortly.
            </div>
          )}
          {!state.success && (
            <div className="alert alert--error">{state.error}</div>
          )}

          <form key={formKey} action={formAction} className="invite-form" noValidate>
            <div className="form-field">
              <label className="form-field__label" htmlFor="email">
                Email address <span className="required">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-field__input"
                placeholder="staff@hospital.com"
                required
                autoComplete="off"
              />
            </div>

            <div className="form-field">
              <label className="form-field__label" htmlFor="role">
                Role <span className="required">*</span>
              </label>
              <select
                id="role"
                name="role"
                className="form-field__select"
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                required
              >
                <option value="hospital_staff">Hospital Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {selectedRole === 'hospital_staff' && (
              <div className="form-field">
                <label className="form-field__label" htmlFor="hospital_id">
                  Hospital <span className="required">*</span>
                </label>
                <select
                  id="hospital_id"
                  name="hospital_id"
                  className="form-field__select"
                  required
                >
                  <option value="">Select a hospital…</option>
                  {hospitals.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.module})
                    </option>
                  ))}
                </select>
                {hospitals.length === 0 && (
                  <p className="form-field__hint">No approved hospitals yet. Approve a hospital first.</p>
                )}
              </div>
            )}

            <button type="submit" className="submit-btn">
              Send invite email →
            </button>
          </form>
        </section>

        {/* Info panel */}
        <section className="card card--info">
          <h2 className="card__title">How invites work</h2>
          <ol className="info-list">
            <li>
              <span className="info-step">1</span>
              <div>
                <strong>Send invite</strong>
                <p>The invited user receives an email with a secure setup link.</p>
              </div>
            </li>
            <li>
              <span className="info-step">2</span>
              <div>
                <strong>User sets password</strong>
                <p>They click the link, enter their name and choose a password.</p>
              </div>
            </li>
            <li>
              <span className="info-step">3</span>
              <div>
                <strong>Account activated</strong>
                <p>They are redirected to their dashboard with full access.</p>
              </div>
            </li>
          </ol>

          <div className="info-note">
            <strong>Note:</strong> Invite links expire after 24 hours.
            If a user misses the link, send a new invite.
          </div>
        </section>
      </div>

      <style>{`
        .page-header { margin-bottom: 28px; }
        .page-title { font-size: 22px; font-weight: 700; color: var(--myop-slate); letter-spacing: -0.4px; }
        .page-sub { font-size: 14px; color: var(--myop-muted); margin-top: 6px; line-height: 1.5; max-width: 540px; }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 20px; align-items: start;
        }
        @media (max-width: 900px) {
          .content-grid { grid-template-columns: 1fr; }
        }

        .card {
          background: #fff; border: 1px solid var(--myop-border);
          border-radius: var(--radius-lg); padding: 28px;
        }
        .card--info { background: #f8fafc; }
        .card__title {
          font-size: 16px; font-weight: 700;
          color: var(--myop-slate); margin-bottom: 20px; letter-spacing: -0.3px;
        }

        .alert {
          padding: 12px 16px; border-radius: var(--radius-sm);
          font-size: 13px; font-weight: 500; margin-bottom: 20px;
        }
        .alert--error   { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .alert--success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }

        .invite-form { display: flex; flex-direction: column; gap: 18px; }
        .form-field { display: flex; flex-direction: column; gap: 6px; }
        .form-field__label {
          font-size: 13px; font-weight: 600; color: var(--myop-slate);
        }
        .required { color: var(--myop-error); }
        .form-field__input, .form-field__select {
          height: 42px; padding: 0 12px;
          border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm);
          font-size: 14px; color: var(--myop-slate);
          background: #fff; outline: none;
          transition: border-color 0.15s;
          width: 100%;
        }
        .form-field__input:focus, .form-field__select:focus {
          border-color: var(--myop-teal);
          box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
        }
        .form-field__hint { font-size: 12px; color: var(--myop-muted); }

        .submit-btn {
          height: 44px; padding: 0 20px;
          background: var(--myop-teal); color: #fff;
          border: none; border-radius: var(--radius-sm);
          font-size: 14px; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
          align-self: flex-start;
        }
        .submit-btn:hover { background: var(--myop-teal-dark); }

        .info-list {
          list-style: none;
          display: flex; flex-direction: column; gap: 16px;
          margin-bottom: 20px;
        }
        .info-list li { display: flex; gap: 12px; align-items: flex-start; }
        .info-step {
          display: flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; min-width: 24px;
          background: var(--myop-teal); color: #fff;
          border-radius: 50%; font-size: 11px; font-weight: 700;
          margin-top: 2px;
        }
        .info-list strong { display: block; font-size: 14px; color: var(--myop-slate); margin-bottom: 2px; }
        .info-list p { font-size: 13px; color: var(--myop-muted); line-height: 1.5; }
        .info-note {
          font-size: 12px; color: var(--myop-muted);
          background: #fff; border: 1px solid var(--myop-border);
          border-radius: var(--radius-sm); padding: 10px 12px;
          line-height: 1.5;
        }
      `}</style>
    </>
  )
}