'use client'

/**
 * app/(admin)/admin/hospitals/[id]/edit/edit-form.tsx
 * Multi-step edit form — same as create but pre-populated.
 */

import { useActionState, useState, useRef } from 'react'
import { updateHospital } from '@/lib/admin/hospitals'
import type { ActionResult } from '@/types/dto'

const initialState: ActionResult = { success: true, data: undefined }

const HOSPITAL_DEPARTMENTS = [
  'General Medicine', 'General Surgery', 'Cardiology', 'Cardiothoracic Surgery',
  'Orthopaedics', 'Neurology', 'Neurosurgery', 'Gastroenterology',
  'Nephrology', 'Urology', 'Oncology', 'Haematology',
  'Pulmonology', 'Endocrinology', 'Rheumatology', 'Dermatology',
  'Ophthalmology', 'ENT', 'Obstetrics & Gynaecology', 'Paediatrics',
  'Neonatology', 'Psychiatry', 'Anaesthesiology', 'Radiology',
  'Emergency Medicine', 'Critical Care', 'Physiotherapy', 'Dietetics',
]

const CLINIC_TYPES = [
  'General Practice', 'Dental Clinic', 'Eye Clinic', 'Skin & Dermatology',
  'Orthopaedic Clinic', 'Paediatric Clinic', 'Gynaecology Clinic',
  'Psychiatry & Mental Health', 'Physiotherapy', 'ENT Clinic',
  'Cardiology Clinic', 'Diabetes & Endocrinology', 'Ayurveda & Naturopathy',
  'Homoeopathy', 'Other',
]

const CLINIC_SERVICES = [
  'General Consultation', 'Follow-up Consultation', 'Health Checkup',
  'Vaccination', 'Minor Procedures', 'Dressing & Wound Care',
  'IV Therapy', 'ECG', 'Nebulisation', 'Suturing',
]

const DIAGNOSTIC_SERVICES = [
  { category: 'Blood Tests', tests: ['Complete Blood Count (CBC)', 'Blood Sugar Fasting', 'Blood Sugar PP', 'HbA1c', 'Lipid Profile', 'Liver Function Test (LFT)', 'Kidney Function Test (KFT)', 'Thyroid Profile (TSH / T3 / T4)', 'Vitamin D', 'Vitamin B12', 'Iron Studies', 'ESR', 'CRP', 'Uric Acid', 'HsCRP'] },
  { category: 'Urine & Stool', tests: ['Urine Routine & Microscopy', 'Urine Culture & Sensitivity', 'Stool Routine', 'Stool Culture'] },
  { category: 'Imaging', tests: ['X-Ray', 'Ultrasound (USG)', 'Echocardiography (Echo)', 'CT Scan', 'MRI', 'Mammography', 'DEXA Scan (Bone Density)'] },
  { category: 'Cardiac', tests: ['ECG', 'Treadmill Test (TMT)', 'Holter Monitoring'] },
  { category: 'Hormones & Infectious Disease', tests: ['Dengue NS1 Antigen', 'Malaria Antigen', 'Typhoid (Widal)', 'HIV Test', 'HBsAg (Hepatitis B)', 'HCV Antibody', 'COVID-19 RT-PCR', 'Pregnancy Test (Beta hCG)'] },
  { category: 'Health Packages', tests: ['Basic Health Checkup Package', 'Comprehensive Health Package', 'Diabetes Screening Package', 'Cardiac Risk Package', "Women's Health Package", "Men's Health Package"] },
]

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
]

interface ServiceEntry { name: string; homeCollection: boolean }

interface Props {
  hospital: {
    id: string; name: string; module: string; email: string; phone: string
    website: string | null; address_line1: string; address_line2: string | null
    city: string; state: string; pincode: string; description: string | null
    platform_commission_pct: number
  }
  existingDepartments: string[]
  existingServices:    ServiceEntry[]
  existingClinicType:  string
}

export default function EditHospitalForm({
  hospital,
  existingDepartments,
  existingServices,
  existingClinicType,
}: Props) {
  const [state, formAction] = useActionState<ActionResult, FormData>(updateHospital, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const module = hospital.module

  // Step 1 state — pre-filled
  const [name, setName]                   = useState(hospital.name)
  const [email, setEmail]                 = useState(hospital.email)
  const [phone, setPhone]                 = useState(hospital.phone)
  const [website, setWebsite]             = useState(hospital.website ?? '')
  const [commissionPct, setCommissionPct] = useState(String(hospital.platform_commission_pct))

  // Step 2 — pre-filled from existing data
  // For hospital: merge standard list + any custom depts from existing
  const customExisting = existingDepartments.filter(d => !HOSPITAL_DEPARTMENTS.includes(d))
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(() => new Set(existingDepartments))
  const [customDepts, setCustomDepts]     = useState<string[]>(customExisting)
  const [customDeptInput, setCustomDeptInput] = useState('')

  const [services, setServices]               = useState<ServiceEntry[]>(existingServices)
  const [customServiceInput, setCustomServiceInput] = useState('')
  const [clinicType, setClinicType]           = useState(existingClinicType)

  // Step 3 — pre-filled
  const [address1, setAddress1]       = useState(hospital.address_line1)
  const [address2, setAddress2]       = useState(hospital.address_line2 ?? '')
  const [city, setCity]               = useState(hospital.city)
  const [stateVal, setStateVal]       = useState(hospital.state)
  const [pincode, setPincode]         = useState(hospital.pincode)
  const [description, setDescription] = useState(hospital.description ?? '')

  function toggleDept(dept: string) {
    setSelectedDepts(prev => { const n = new Set(prev); n.has(dept) ? n.delete(dept) : n.add(dept); return n })
  }

  function addCustomDept() {
    const val = customDeptInput.trim()
    if (!val || customDepts.includes(val)) return
    setCustomDepts(prev => [...prev, val])
    setSelectedDepts(prev => new Set([...prev, val]))
    setCustomDeptInput('')
  }

  function toggleService(sname: string) {
    setServices(prev => prev.find(s => s.name === sname)
      ? prev.filter(s => s.name !== sname)
      : [...prev, { name: sname, homeCollection: false }])
  }

  function toggleHomeCollection(sname: string) {
    setServices(prev => prev.map(s => s.name === sname ? { ...s, homeCollection: !s.homeCollection } : s))
  }

  const isSelected = (sname: string) => services.some(s => s.name === sname)
  const isHomeColl = (sname: string) => services.find(s => s.name === sname)?.homeCollection ?? false

  function addCustomService() {
    const val = customServiceInput.trim()
    if (!val || services.find(s => s.name === val)) return
    setServices(prev => [...prev, { name: val, homeCollection: false }])
    setCustomServiceInput('')
  }

  const allDepts = [...HOSPITAL_DEPARTMENTS, ...customDepts]
  const progress = step === 1 ? 33 : step === 2 ? 66 : 100

  const MODULE_LABELS: Record<string, string> = {
    hospital: 'Hospital', diagnostic: 'Diagnostic Centre', clinic: 'Clinic',
  }

  return (
    <>
      <div className="page-header">
        <a href={`/admin/hospitals/${hospital.id}`} className="back-link">← Back to hospital</a>
        <h1 className="page-title">Edit — {hospital.name}</h1>
        <p className="page-sub">{MODULE_LABELS[module]}</p>
      </div>

      <div className="edit-layout">
        <div className="form-card">
          <div className="progress-bar"><div className="progress-bar__fill" style={{ width: `${progress}%` }} /></div>
          <div className="progress-steps">
            {['Basic info', module === 'hospital' ? 'Departments' : 'Services', 'Address'].map((label, i) => (
              <div key={label} className={`progress-step ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}>
                <span className="progress-step__num">{step > i + 1 ? '✓' : i + 1}</span>
                <span className="progress-step__label">{label}</span>
              </div>
            ))}
          </div>

          {!state.success && <div className="alert alert--error">⚠ {state.error}</div>}

          <form ref={formRef} action={formAction} noValidate>
            <input type="hidden" name="hospital_id"           value={hospital.id} />
            <input type="hidden" name="name"                  value={name} />
            <input type="hidden" name="email"                 value={email} />
            <input type="hidden" name="phone"                 value={phone} />
            <input type="hidden" name="website"               value={website} />
            <input type="hidden" name="platform_commission_pct" value={commissionPct} />
            <input type="hidden" name="address_line1"         value={address1} />
            <input type="hidden" name="address_line2"         value={address2} />
            <input type="hidden" name="city"                  value={city} />
            <input type="hidden" name="state"                 value={stateVal} />
            <input type="hidden" name="pincode"               value={pincode} />
            <input type="hidden" name="description"           value={description} />
            {clinicType && <input type="hidden" name="clinic_type" value={clinicType} />}
            {module === 'hospital' && Array.from(selectedDepts)
              .map(d => <input key={d} type="hidden" name="departments[]" value={d} />)
            }
            {(module === 'diagnostic' || module === 'clinic') && services.map(s =>
              <input key={s.name} type="hidden" name="services[]" value={`${s.name}|${s.homeCollection}`} />
            )}

            {/* STEP 1 — Basic info */}
            {step === 1 && (
              <div className="step">
                <h2 className="step-title">Basic information</h2>
                <div className="field-grid">
                  <div className="form-field col-full">
                    <label className="form-field__label">Facility name <span className="req">*</span></label>
                    <input type="text" className="form-field__input" value={name} onChange={e => setName(e.target.value)} required maxLength={200} />
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">Email <span className="req">*</span></label>
                    <input type="email" className="form-field__input" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">Phone <span className="req">*</span></label>
                    <input type="tel" className="form-field__input" value={phone} onChange={e => setPhone(e.target.value)} required />
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">Website</label>
                    <input type="url" className="form-field__input" value={website} onChange={e => setWebsite(e.target.value)} />
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">Commission % <span className="req">*</span></label>
                    <input type="number" min="0" max="100" step="0.5" className="form-field__input" value={commissionPct} onChange={e => setCommissionPct(e.target.value)} />
                  </div>
                </div>
                <button type="button" className="next-btn" onClick={() => setStep(2)} disabled={!name.trim() || !email.trim() || !phone.trim()}>Continue →</button>
              </div>
            )}

            {/* STEP 2 — Departments or Services */}
            {step === 2 && (
              <div className="step">
                {module === 'hospital' && (
                  <>
                    <h2 className="step-title">Departments</h2>
                    <p className="step-sub">Currently active departments are pre-selected.</p>
                    <div className="dept-stats">
                      <span>{selectedDepts.size} selected</span>
                      <button type="button" className="select-all-btn" onClick={() => setSelectedDepts(new Set(allDepts))}>Select all</button>
                      <button type="button" className="select-all-btn" onClick={() => setSelectedDepts(new Set())}>Clear all</button>
                    </div>
                    <div className="dept-grid">
                      {allDepts.map(dept => (
                        <label key={dept} className={`dept-chip ${selectedDepts.has(dept) ? 'is-checked' : ''}`}>
                          <input type="checkbox" checked={selectedDepts.has(dept)} onChange={() => toggleDept(dept)} className="sr-only" />
                          <span className="dept-chip__check">{selectedDepts.has(dept) ? '✓' : ''}</span>
                          {dept}
                        </label>
                      ))}
                    </div>
                    <div className="custom-add">
                      <label className="form-field__label">Add custom department</label>
                      <div className="custom-add__row">
                        <input type="text" className="form-field__input" value={customDeptInput} onChange={e => setCustomDeptInput(e.target.value)} placeholder="e.g. Sports Medicine" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomDept())} maxLength={100} />
                        <button type="button" className="add-btn" onClick={addCustomDept}>+ Add</button>
                      </div>
                    </div>
                  </>
                )}

                {module === 'diagnostic' && (
                  <>
                    <h2 className="step-title">Services</h2>
                    <p className="step-sub">Currently active services are pre-selected. Toggle 🏠 for home collection.</p>
                    {DIAGNOSTIC_SERVICES.map(cat => (
                      <div key={cat.category} className="service-category">
                        <h3 className="service-category__title">{cat.category}</h3>
                        <div className="service-list">
                          {cat.tests.map(test => (
                            <div key={test} className={`service-row ${isSelected(test) ? 'is-selected' : ''}`}>
                              <label className="service-row__check">
                                <input type="checkbox" checked={isSelected(test)} onChange={() => toggleService(test)} className="sr-only" />
                                <span className="service-check">{isSelected(test) ? '✓' : ''}</span>
                                <span className="service-name">{test}</span>
                              </label>
                              {isSelected(test) && (
                                <button type="button" className={`home-toggle ${isHomeColl(test) ? 'is-on' : ''}`} onClick={() => toggleHomeCollection(test)}>
                                  🏠 {isHomeColl(test) ? 'Home collection' : 'No home collection'}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="custom-add">
                      <label className="form-field__label">Add custom test / service</label>
                      <div className="custom-add__row">
                        <input type="text" className="form-field__input" value={customServiceInput} onChange={e => setCustomServiceInput(e.target.value)} placeholder="e.g. Hair Analysis" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomService())} maxLength={100} />
                        <button type="button" className="add-btn" onClick={addCustomService}>+ Add</button>
                      </div>
                      {services.filter(s => !DIAGNOSTIC_SERVICES.flatMap(c => c.tests).includes(s.name)).map(s => (
                        <div key={s.name} className="custom-service-tag">
                          <span>{s.name}</span>
                          <button type="button" className={`home-toggle ${s.homeCollection ? 'is-on' : ''}`} onClick={() => toggleHomeCollection(s.name)}>🏠 {s.homeCollection ? 'Home collection' : 'No home collection'}</button>
                          <button type="button" className="remove-btn" onClick={() => setServices(prev => prev.filter(x => x.name !== s.name))}>✕</button>
                        </div>
                      ))}
                    </div>
                    <div className="selected-summary">{services.length} services selected{services.filter(s => s.homeCollection).length > 0 && ` · ${services.filter(s => s.homeCollection).length} with home collection`}</div>
                  </>
                )}

                {module === 'clinic' && (
                  <>
                    <h2 className="step-title">Clinic type <span className="req">*</span></h2>
                    <div className="clinic-type-grid">
                      {CLINIC_TYPES.map(type => (
                        <label key={type} className={`clinic-type-chip ${clinicType === type ? 'is-selected' : ''}`}>
                          <input type="radio" checked={clinicType === type} onChange={() => setClinicType(type)} className="sr-only" />
                          {type}
                        </label>
                      ))}
                    </div>
                    <h2 className="step-title" style={{ marginTop: 16 }}>Services offered</h2>
                    <div className="dept-grid">
                      {CLINIC_SERVICES.map(service => (
                        <label key={service} className={`dept-chip ${isSelected(service) ? 'is-checked' : ''}`}>
                          <input type="checkbox" checked={isSelected(service)} onChange={() => toggleService(service)} className="sr-only" />
                          <span className="dept-chip__check">{isSelected(service) ? '✓' : ''}</span>
                          {service}
                        </label>
                      ))}
                    </div>
                    <div className="custom-add">
                      <label className="form-field__label">Add custom service</label>
                      <div className="custom-add__row">
                        <input type="text" className="form-field__input" value={customServiceInput} onChange={e => setCustomServiceInput(e.target.value)} placeholder="e.g. Laser Treatment" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomService())} maxLength={100} />
                        <button type="button" className="add-btn" onClick={addCustomService}>+ Add</button>
                      </div>
                      {services.filter(s => !CLINIC_SERVICES.includes(s.name)).map(s => (
                        <div key={s.name} className="custom-service-tag">
                          <span>{s.name}</span>
                          <button type="button" className="remove-btn" onClick={() => setServices(prev => prev.filter(x => x.name !== s.name))}>✕</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="step-nav">
                  <button type="button" className="back-btn" onClick={() => setStep(1)}>← Back</button>
                  <button type="button" className="next-btn" onClick={() => setStep(3)} disabled={module === 'clinic' && !clinicType}>Continue →</button>
                </div>
              </div>
            )}

            {/* STEP 3 — Address */}
            {step === 3 && (
              <div className="step">
                <h2 className="step-title">Address</h2>
                <div className="field-grid">
                  <div className="form-field col-full">
                    <label className="form-field__label">Street address <span className="req">*</span></label>
                    <input type="text" className="form-field__input" value={address1} onChange={e => setAddress1(e.target.value)} required maxLength={200} />
                  </div>
                  <div className="form-field col-full">
                    <label className="form-field__label">Landmark / Area</label>
                    <input type="text" className="form-field__input" value={address2} onChange={e => setAddress2(e.target.value)} maxLength={200} />
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">City <span className="req">*</span></label>
                    <input type="text" className="form-field__input" value={city} onChange={e => setCity(e.target.value)} required maxLength={100} />
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">State <span className="req">*</span></label>
                    <select className="form-field__input" value={stateVal} onChange={e => setStateVal(e.target.value)} required>
                      <option value="">Select state…</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">Pincode <span className="req">*</span></label>
                    <input type="text" className="form-field__input" value={pincode} onChange={e => setPincode(e.target.value)} required maxLength={6} />
                  </div>
                </div>

                <h2 className="step-title" style={{ marginTop: 8 }}>Description <span className="opt">(optional)</span></h2>
                <textarea className="form-field__textarea" value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={1000} />

                <div className="submit-summary">
                  <div className="summary-item"><span>Facility</span><strong>{name}</strong></div>
                  <div className="summary-item"><span>Type</span><strong>{MODULE_LABELS[module]}</strong></div>
                  {module === 'hospital' && <div className="summary-item"><span>Departments</span><strong>{selectedDepts.size} selected</strong></div>}
                  {(module === 'diagnostic' || module === 'clinic') && <div className="summary-item"><span>Services</span><strong>{services.length} selected</strong></div>}
                  {module === 'clinic' && clinicType && <div className="summary-item"><span>Clinic type</span><strong>{clinicType}</strong></div>}
                </div>

                <div className="step-nav">
                  <button type="button" className="back-btn" onClick={() => setStep(2)}>← Back</button>
                  <button type="submit" className="next-btn" disabled={!address1.trim() || !city.trim() || !stateVal || !pincode.trim()}>Save changes</button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <style>{`
        .page-header { margin-bottom: 24px; }
        .back-link { font-size: 13px; color: var(--myop-muted); text-decoration: none; display: inline-block; margin-bottom: 8px; transition: color 0.15s; }
        .back-link:hover { color: var(--myop-slate); }
        .page-title { font-size: 22px; font-weight: 700; color: var(--myop-slate); letter-spacing: -0.4px; }
        .page-sub { font-size: 13px; color: var(--myop-muted); margin-top: 4px; }

        .edit-layout { max-width: 860px; }
        .form-card { background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-lg); overflow: hidden; }

        .progress-bar { height: 4px; background: #f1f5f9; }
        .progress-bar__fill { height: 100%; background: var(--myop-teal); transition: width 0.3s ease; }
        .progress-steps { display: flex; padding: 14px 20px 0; border-bottom: 1px solid var(--myop-border); }
        .progress-step { display: flex; align-items: center; gap: 6px; padding-bottom: 12px; flex: 1; font-size: 12px; font-weight: 500; color: var(--myop-muted); border-bottom: 2px solid transparent; margin-bottom: -1px; }
        .progress-step.active { color: var(--myop-teal); border-bottom-color: var(--myop-teal); }
        .progress-step.done { color: var(--myop-teal); }
        .progress-step__num { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: #f1f5f9; font-size: 10px; font-weight: 700; flex-shrink: 0; }
        .progress-step.active .progress-step__num, .progress-step.done .progress-step__num { background: var(--myop-teal); color: #fff; }

        .alert { margin: 16px 20px 0; padding: 12px 14px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; }
        .alert--error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

        .step { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .step-title { font-size: 14px; font-weight: 700; color: var(--myop-slate); }
        .step-sub { font-size: 13px; color: var(--myop-muted); line-height: 1.5; margin-top: -8px; }
        .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
        .opt { font-weight: 400; color: var(--myop-muted); font-size: 11px; }

        .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 560px) { .field-grid { grid-template-columns: 1fr; } }
        .col-full { grid-column: 1 / -1; }
        .form-field { display: flex; flex-direction: column; gap: 5px; }
        .form-field__label { font-size: 13px; font-weight: 600; color: var(--myop-slate); }
        .req { color: var(--myop-error); }
        .form-field__input { height: 40px; padding: 0 12px; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); font-size: 14px; color: var(--myop-slate); background: #fff; outline: none; font-family: inherit; width: 100%; transition: border-color 0.15s; }
        .form-field__input:focus { border-color: var(--myop-teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
        .form-field__textarea { padding: 10px 12px; width: 100%; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); font-size: 14px; font-family: inherit; resize: vertical; outline: none; transition: border-color 0.15s; }
        .form-field__textarea:focus { border-color: var(--myop-teal); }

        .dept-stats { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--myop-muted); }
        .select-all-btn { background: none; border: 1px solid var(--myop-border); border-radius: 4px; padding: 3px 8px; font-size: 11px; color: var(--myop-muted); cursor: pointer; transition: all 0.15s; }
        .select-all-btn:hover { border-color: var(--myop-teal); color: var(--myop-teal); }
        .dept-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
        .dept-chip { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); cursor: pointer; font-size: 13px; color: var(--myop-muted); transition: all 0.15s; user-select: none; }
        .dept-chip.is-checked { border-color: var(--myop-teal); background: #f0fdfa; color: var(--myop-slate); font-weight: 500; }
        .dept-chip__check { width: 16px; height: 16px; border-radius: 3px; border: 1.5px solid var(--myop-border); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
        .dept-chip.is-checked .dept-chip__check { background: var(--myop-teal); border-color: var(--myop-teal); color: #fff; }

        .service-category { display: flex; flex-direction: column; gap: 8px; }
        .service-category__title { font-size: 12px; font-weight: 700; color: var(--myop-muted); text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 0 4px; border-bottom: 1px solid #f1f5f9; }
        .service-list { display: flex; flex-direction: column; gap: 4px; }
        .service-row { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: var(--radius-sm); transition: background 0.15s; }
        .service-row:hover { background: #f8fafc; }
        .service-row.is-selected { background: #f0fdfa; }
        .service-row__check { display: flex; align-items: center; gap: 8px; flex: 1; font-size: 13px; color: var(--myop-muted); cursor: pointer; }
        .service-row.is-selected .service-row__check { color: var(--myop-slate); }
        .service-check { width: 16px; height: 16px; border-radius: 3px; border: 1.5px solid var(--myop-border); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
        .service-row.is-selected .service-check { background: var(--myop-teal); border-color: var(--myop-teal); color: #fff; }
        .home-toggle { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; border: 1px solid var(--myop-border); background: #fff; cursor: pointer; color: var(--myop-muted); white-space: nowrap; transition: all 0.15s; flex-shrink: 0; }
        .home-toggle.is-on { background: #ecfdf5; border-color: #6ee7b7; color: #065f46; font-weight: 600; }
        .selected-summary { font-size: 13px; color: var(--myop-muted); padding: 8px 12px; background: #f8fafc; border-radius: var(--radius-sm); border: 1px solid var(--myop-border); }

        .clinic-type-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
        .clinic-type-chip { display: flex; align-items: center; justify-content: center; padding: 9px 12px; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); cursor: pointer; font-size: 13px; color: var(--myop-muted); text-align: center; transition: all 0.15s; user-select: none; }
        .clinic-type-chip.is-selected { border-color: var(--myop-teal); background: #f0fdfa; color: var(--myop-teal); font-weight: 600; }

        .custom-add { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: #f8fafc; border-radius: var(--radius-sm); border: 1px dashed var(--myop-border); }
        .custom-add__row { display: flex; gap: 8px; }
        .add-btn { height: 40px; padding: 0 14px; background: var(--myop-teal); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; flex-shrink: 0; transition: background 0.15s; }
        .add-btn:hover { background: var(--myop-teal-dark); }
        .custom-service-tag { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-sm); font-size: 13px; }
        .custom-service-tag span { flex: 1; }
        .remove-btn { background: none; border: none; color: var(--myop-muted); cursor: pointer; font-size: 14px; padding: 0 4px; transition: color 0.15s; }
        .remove-btn:hover { color: var(--myop-error); }

        .submit-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 14px; background: #f8fafc; border-radius: var(--radius-sm); border: 1px solid var(--myop-border); }
        .summary-item { display: flex; flex-direction: column; gap: 2px; }
        .summary-item span { font-size: 11px; color: var(--myop-muted); text-transform: uppercase; letter-spacing: 0.4px; }
        .summary-item strong { font-size: 13px; color: var(--myop-slate); }

        .step-nav { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .back-btn { height: 40px; padding: 0 16px; background: #f1f5f9; color: var(--myop-slate); border: 1px solid var(--myop-border); border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .back-btn:hover { background: #e2e8f0; }
        .next-btn { height: 44px; padding: 0 24px; background: var(--myop-teal); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.15s, opacity 0.15s; }
        .next-btn:hover:not(:disabled) { background: var(--myop-teal-dark); }
        .next-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </>
  )
}