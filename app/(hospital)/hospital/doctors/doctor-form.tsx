'use client'

/**
 * components shared by new and edit doctor pages
 */

import { useActionState } from 'react'
import type { ActionResult } from '@/types/dto'

const GENDERS = [
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other' },
]

interface Department { id: string; name: string }

interface Props {
  action:      (prevState: ActionResult, formData: FormData) => Promise<ActionResult>
  departments: Department[]
  doctor?: {
    id:                  string
    full_name:           string
    qualification:       string
    registration_number: string
    experience_years:    number
    consultation_fee:    number
    gender:              string | null
    bio:                 string | null
    languages:           string[] | null
    department_id:       string | null
  }
}

const initialState: ActionResult = { success: true, data: undefined }

export default function DoctorForm({ action, departments, doctor }: Props) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, initialState)
  const isEdit = !!doctor

  return (
    <>
      {!state.success && (
        <div className="alert alert--error">⚠ {state.error}</div>
      )}

      <form action={formAction} noValidate className="doctor-form">
        {isEdit && <input type="hidden" name="doctor_id" value={doctor!.id} />}

        <div className="field-grid">
          <div className="form-field col-full">
            <label className="form-field__label">Full name <span className="req">*</span></label>
            <input name="full_name" type="text" className="form-field__input"
              defaultValue={doctor?.full_name} required maxLength={100}
              placeholder="Dr. Priya Nair" />
          </div>
          <div className="form-field">
            <label className="form-field__label">Department <span className="req">*</span></label>
            {departments.length === 0 ? (
              <div className="form-field__hint" style={{ color: 'var(--myop-error)' }}>
                No departments set up. Add departments to your hospital first.
              </div>
            ) : (
              <select name="department_id" className="form-field__input" required
                defaultValue={doctor?.department_id ?? ''}>
                <option value="">Select department…</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="form-field">
            <label className="form-field__label">Qualification <span className="req">*</span></label>
            <input name="qualification" type="text" className="form-field__input"
              defaultValue={doctor?.qualification} required maxLength={200}
              placeholder="MBBS, MD (Cardiology)" />
          </div>
          <div className="form-field">
            <label className="form-field__label">Registration number <span className="req">*</span></label>
            <input name="registration_number" type="text" className="form-field__input"
              defaultValue={doctor?.registration_number} required maxLength={50}
              placeholder="KMC-12345" />
          </div>
          <div className="form-field">
            <label className="form-field__label">Experience (years) <span className="req">*</span></label>
            <input name="experience_years" type="number" min="0" max="80"
              className="form-field__input"
              defaultValue={doctor?.experience_years ?? 0} required />
          </div>
          <div className="form-field">
            <label className="form-field__label">Consultation fee (₹) <span className="req">*</span></label>
            <input name="consultation_fee" type="number" min="0"
              className="form-field__input"
              defaultValue={doctor?.consultation_fee} required
              placeholder="500" />
          </div>
          <div className="form-field">
            <label className="form-field__label">Gender</label>
            <select name="gender" className="form-field__input"
              defaultValue={doctor?.gender ?? ''}>
              <option value="">Prefer not to say</option>
              {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          {departments.length > 0 && (
            <div className="form-field">
              <label className="form-field__label">Department</label>
              <select name="department_id" className="form-field__input"
                defaultValue={doctor?.department_id ?? ''}>
                <option value="">No department</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-field col-full">
            <label className="form-field__label">Languages spoken</label>
            <input name="languages" type="text" className="form-field__input"
              defaultValue={doctor?.languages?.join(', ')}
              placeholder="English, Malayalam, Hindi (comma-separated)" maxLength={200} />
          </div>
          <div className="form-field col-full">
            <label className="form-field__label">Bio / About</label>
            <textarea name="bio" className="form-field__textarea" rows={3}
              defaultValue={doctor?.bio ?? ''}
              placeholder="Brief description of the doctor's expertise and approach…"
              maxLength={1000} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">
            {isEdit ? 'Save changes' : 'Add doctor'}
          </button>
          <a href="/hospital/doctors" className="cancel-btn">Cancel</a>
        </div>
      </form>

      <style>{`
        .alert { padding: 12px 16px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; margin-bottom: 20px; }
        .alert--error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .doctor-form { display: flex; flex-direction: column; gap: 20px; }
        .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .field-grid { grid-template-columns: 1fr; } }
        .col-full { grid-column: 1 / -1; }
        .form-field { display: flex; flex-direction: column; gap: 5px; }
        .form-field__label { font-size: 13px; font-weight: 600; color: var(--myop-slate); }
        .req { color: var(--myop-error); }
        .form-field__input { height: 42px; padding: 0 12px; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); font-size: 14px; color: var(--myop-slate); background: #fff; outline: none; font-family: inherit; width: 100%; transition: border-color 0.15s; }
        .form-field__input:focus { border-color: var(--myop-teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
        .form-field__textarea { padding: 10px 12px; width: 100%; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); font-size: 14px; font-family: inherit; resize: vertical; outline: none; transition: border-color 0.15s; }
        .form-field__textarea:focus { border-color: var(--myop-teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
        .form-actions { display: flex; align-items: center; gap: 12px; }
        .submit-btn { height: 44px; padding: 0 24px; background: var(--myop-teal); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.15s; }
        .submit-btn:hover { background: var(--myop-teal-dark); }
        .cancel-btn { font-size: 14px; color: var(--myop-muted); text-decoration: none; transition: color 0.15s; }
        .cancel-btn:hover { color: var(--myop-slate); }
      `}</style>
    </>
  )
}