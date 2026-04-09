'use client'

import { useActionState } from 'react'
import type { ActionResult } from '@/types/dto'

const initialState: ActionResult = { success: true, data: undefined }

interface Props {
  action:  (prevState: ActionResult, formData: FormData) => Promise<ActionResult>
  module:  string
  service?: {
    id:                 string
    name:               string
    description:        string | null
    category:           string | null
    price:              number
    duration_mins:      number | null
    preparation:        string | null
    report_tat_hrs:     number | null
    is_home_collection: boolean
  }
}

export default function ServiceForm({ action, module, service }: Props) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, initialState)
  const isEdit = !!service
  const isDiagnostic = module === 'diagnostic'

  return (
    <>
      {!state.success && (
        <div className="alert alert--error">⚠ {state.error}</div>
      )}

      <form action={formAction} noValidate className="service-form">
        {isEdit && <input type="hidden" name="service_id" value={service!.id} />}

        <div className="field-grid">
          <div className="form-field col-full">
            <label className="form-field__label">Service name <span className="req">*</span></label>
            <input name="name" type="text" className="form-field__input"
              defaultValue={service?.name} required maxLength={200}
              placeholder={isDiagnostic ? 'e.g. Complete Blood Count (CBC)' : 'e.g. General Consultation'} />
          </div>
          <div className="form-field">
            <label className="form-field__label">Category</label>
            <input name="category" type="text" className="form-field__input"
              defaultValue={service?.category ?? ''}
              placeholder={isDiagnostic ? 'e.g. Blood Tests' : 'e.g. Consultation'} maxLength={100} />
          </div>
          <div className="form-field">
            <label className="form-field__label">Price (₹) <span className="req">*</span></label>
            <input name="price" type="number" min="0" className="form-field__input"
              defaultValue={service?.price} required placeholder="500" />
          </div>
          <div className="form-field">
            <label className="form-field__label">Duration (minutes)</label>
            <input name="duration_mins" type="number" min="0"
              className="form-field__input"
              defaultValue={service?.duration_mins ?? ''}
              placeholder="30" />
          </div>
          {isDiagnostic && (
            <div className="form-field">
              <label className="form-field__label">Report TAT (hours)</label>
              <input name="report_tat_hrs" type="number" min="0"
                className="form-field__input"
                defaultValue={service?.report_tat_hrs ?? ''}
                placeholder="24" />
              <span className="form-field__hint">Time to get test results</span>
            </div>
          )}
          <div className="form-field col-full">
            <label className="form-field__label">Description</label>
            <textarea name="description" className="form-field__textarea" rows={2}
              defaultValue={service?.description ?? ''}
              placeholder="Brief description of the service…" maxLength={500} />
          </div>
          {isDiagnostic && (
            <div className="form-field col-full">
              <label className="form-field__label">Preparation instructions</label>
              <textarea name="preparation" className="form-field__textarea" rows={2}
                defaultValue={service?.preparation ?? ''}
                placeholder="e.g. 8-12 hours fasting required before the test" maxLength={500} />
            </div>
          )}
          {isDiagnostic && (
            <div className="form-field col-full">
              <label className="toggle-label">
                <input name="is_home_collection" type="checkbox"
                  className="toggle-input"
                  defaultChecked={service?.is_home_collection ?? false}
                  value="true" />
                <span className="toggle-text">
                  🏠 Home collection available
                  <span className="toggle-sub">Technician visits patient's home to collect sample</span>
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">
            {isEdit ? 'Save changes' : 'Add service'}
          </button>
          <a href="/hospital/services" className="cancel-btn">Cancel</a>
        </div>
      </form>

      <style>{`
        .alert { padding: 12px 16px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; margin-bottom: 20px; }
        .alert--error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .service-form { display: flex; flex-direction: column; gap: 20px; }
        .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .field-grid { grid-template-columns: 1fr; } }
        .col-full { grid-column: 1 / -1; }
        .form-field { display: flex; flex-direction: column; gap: 5px; }
        .form-field__label { font-size: 13px; font-weight: 600; color: var(--myop-slate); }
        .req { color: var(--myop-error); }
        .form-field__input { height: 42px; padding: 0 12px; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); font-size: 14px; color: var(--myop-slate); background: #fff; outline: none; font-family: inherit; width: 100%; transition: border-color 0.15s; }
        .form-field__input:focus { border-color: var(--myop-teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
        .form-field__hint { font-size: 11px; color: var(--myop-muted); }
        .form-field__textarea { padding: 10px 12px; width: 100%; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); font-size: 14px; font-family: inherit; resize: vertical; outline: none; transition: border-color 0.15s; }
        .form-field__textarea:focus { border-color: var(--myop-teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
        .toggle-label { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; padding: 12px; background: #f8fafc; border-radius: var(--radius-sm); border: 1.5px solid var(--myop-border); transition: border-color 0.15s; }
        .toggle-label:has(.toggle-input:checked) { border-color: var(--myop-teal); background: #f0fdfa; }
        .toggle-input { margin-top: 3px; accent-color: var(--myop-teal); flex-shrink: 0; width: 16px; height: 16px; }
        .toggle-text { display: flex; flex-direction: column; gap: 2px; font-size: 14px; font-weight: 600; color: var(--myop-slate); }
        .toggle-sub { font-size: 12px; font-weight: 400; color: var(--myop-muted); }
        .form-actions { display: flex; align-items: center; gap: 12px; }
        .submit-btn { height: 44px; padding: 0 24px; background: var(--myop-teal); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.15s; }
        .submit-btn:hover { background: var(--myop-teal-dark); }
        .cancel-btn { font-size: 14px; color: var(--myop-muted); text-decoration: none; transition: color 0.15s; }
        .cancel-btn:hover { color: var(--myop-slate); }
      `}</style>
    </>
  )
}