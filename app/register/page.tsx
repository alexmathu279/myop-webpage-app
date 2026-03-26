'use client'

/**
 * app/register/page.tsx
 * MYOP Healthcare Marketplace — Public Hospital Registration
 *
 * Multi-step registration form:
 *   Step 1 — Module selection + basic info
 *   Step 2 — Module-specific data
 *             Hospital:    department checklist + custom departments
 *             Diagnostic:  service checklist with home collection toggles + custom
 *             Clinic:      clinic type + service checklist + custom
 *   Step 3 — Address + description + submit
 */

import { useActionState, useState, useRef } from 'react'
import { registerHospital } from '@/lib/admin/register'
import type { ActionResult } from '@/types/dto'

const initialState: ActionResult = { success: true, data: undefined }

// ---------------------------------------------------------------------------
// Data constants
// ---------------------------------------------------------------------------

const MODULES = [
  { value: 'hospital',   label: 'Hospital',          icon: '🏥', desc: 'Multi-specialty hospital with doctors and departments' },
  { value: 'diagnostic', label: 'Diagnostic Centre',  icon: '🧪', desc: 'Lab tests, imaging, and health packages' },
  { value: 'clinic',     label: 'Private Clinic',     icon: '💊', desc: 'Outpatient clinic or specialist practice' },
]

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

const DIAGNOSTIC_SERVICES: { category: string; tests: string[] }[] = [
  {
    category: 'Blood Tests',
    tests: [
      'Complete Blood Count (CBC)', 'Blood Sugar Fasting', 'Blood Sugar PP',
      'HbA1c', 'Lipid Profile', 'Liver Function Test (LFT)',
      'Kidney Function Test (KFT)', 'Thyroid Profile (TSH / T3 / T4)',
      'Vitamin D', 'Vitamin B12', 'Iron Studies', 'ESR', 'CRP',
      'Uric Acid', 'HsCRP',
    ],
  },
  {
    category: 'Urine & Stool',
    tests: [
      'Urine Routine & Microscopy', 'Urine Culture & Sensitivity',
      'Stool Routine', 'Stool Culture',
    ],
  },
  {
    category: 'Imaging',
    tests: [
      'X-Ray', 'Ultrasound (USG)', 'Echocardiography (Echo)',
      'CT Scan', 'MRI', 'Mammography', 'DEXA Scan (Bone Density)',
    ],
  },
  {
    category: 'Cardiac',
    tests: ['ECG', 'Treadmill Test (TMT)', 'Holter Monitoring'],
  },
  {
    category: 'Hormones & Infectious Disease',
    tests: [
      'Dengue NS1 Antigen', 'Malaria Antigen', 'Typhoid (Widal)',
      'HIV Test', 'HBsAg (Hepatitis B)', 'HCV Antibody',
      'COVID-19 RT-PCR', 'Pregnancy Test (Beta hCG)',
    ],
  },
  {
    category: 'Health Packages',
    tests: [
      'Basic Health Checkup Package', 'Comprehensive Health Package',
      'Diabetes Screening Package', 'Cardiac Risk Package',
      "Women's Health Package", "Men's Health Package",
    ],
  },
]

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceEntry {
  name:            string
  homeCollection:  boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  const [state, formAction] = useActionState<ActionResult, FormData>(
    registerHospital,
    initialState,
  )

  const formRef = useRef<HTMLFormElement>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1 state
  const [module, setModule]   = useState<'hospital' | 'diagnostic' | 'clinic'>('hospital')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [website, setWebsite] = useState('')

  // Step 2 — hospital
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(
    new Set(HOSPITAL_DEPARTMENTS)
  )
  const [customDepts, setCustomDepts] = useState<string[]>([])
  const [customDeptInput, setCustomDeptInput] = useState('')

  // Step 2 — diagnostic/clinic services
  const [services, setServices] = useState<ServiceEntry[]>([])
  const [customServiceInput, setCustomServiceInput] = useState('')
  const [clinicType, setClinicType] = useState('')

  // Step 3 state
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity]         = useState('')
  const [stateVal, setStateVal] = useState('')
  const [pincode, setPincode]   = useState('')
  const [description, setDescription] = useState('')

  // Step 1 validation
  function handleStep1() {
    if (!name.trim() || !email.trim() || !phone.trim()) return
    // Reset services when module changes
    if (module === 'hospital') {
      setSelectedDepts(new Set(HOSPITAL_DEPARTMENTS))
    } else {
      setServices([])
    }
    setStep(2)
  }

  // Step 2 validation
  function handleStep2() {
    if (module === 'clinic' && !clinicType) return
    setStep(3)
  }

  // Toggle department
  function toggleDept(dept: string) {
    setSelectedDepts(prev => {
      const next = new Set(prev)
      if (next.has(dept)) next.delete(dept)
      else next.add(dept)
      return next
    })
  }

  // Add custom department
  function addCustomDept() {
    const val = customDeptInput.trim()
    if (!val || customDepts.includes(val)) return
    setCustomDepts(prev => [...prev, val])
    setSelectedDepts(prev => new Set([...prev, val]))
    setCustomDeptInput('')
  }

  // Toggle pre-listed service
  function toggleService(name: string) {
    setServices(prev => {
      const exists = prev.find(s => s.name === name)
      if (exists) return prev.filter(s => s.name !== name)
      return [...prev, { name, homeCollection: false }]
    })
  }

  function toggleHomeCollection(name: string) {
    setServices(prev =>
      prev.map(s => s.name === name ? { ...s, homeCollection: !s.homeCollection } : s)
    )
  }

  function isServiceSelected(name: string) {
    return services.some(s => s.name === name)
  }

  function isHomeCollection(name: string) {
    return services.find(s => s.name === name)?.homeCollection ?? false
  }

  function addCustomService() {
    const val = customServiceInput.trim()
    if (!val || services.find(s => s.name === val)) return
    setServices(prev => [...prev, { name: val, homeCollection: false }])
    setCustomServiceInput('')
  }

  const allDepts = [...HOSPITAL_DEPARTMENTS, ...customDepts]
  const progress = step === 1 ? 33 : step === 2 ? 66 : 100

  return (
    <div className="register-shell">
      {/* Header */}
      <header className="register-header">
        <a href="/" className="register-logo">
          <span className="logo-mark">M</span>
          <span className="logo-text">MYOP Health</span>
        </a>
        <a href="/auth/login" className="header-login">Already registered? Sign in</a>
      </header>

      <div className="register-body">
        {/* Left intro */}
        <div className="register-intro">
          <h1 className="register-intro__title">
            List your facility on<br />
            <em>MYOP Health</em>
          </h1>
          <p className="register-intro__sub">
            Reach thousands of patients in your area. Submit your registration
            and our team will review it within 2 business days.
          </p>
          <ul className="register-intro__benefits">
            <li>✓ Free to register</li>
            <li>✓ No monthly fees</li>
            <li>✓ 10–15% commission per booking only</li>
            <li>✓ Weekly payouts to your bank account</li>
            <li>✓ Doctors & services managed from your dashboard</li>
          </ul>
        </div>

        {/* Right form */}
        <div className="register-form-card">
          {/* Progress bar */}
          <div className="progress-bar">
            <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-steps">
            {['Basic info', 'Details', 'Address'].map((label, i) => (
              <div key={label} className={`progress-step ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}>
                <span className="progress-step__num">{step > i + 1 ? '✓' : i + 1}</span>
                <span className="progress-step__label">{label}</span>
              </div>
            ))}
          </div>

          {!state.success && (
            <div className="alert alert--error">⚠ {state.error}</div>
          )}

          {/* The actual form — hidden inputs carry all state on submit */}
          <form ref={formRef} action={formAction} noValidate>
            {/* Hidden fields carrying all collected state */}
            <input type="hidden" name="module"        value={module} />
            <input type="hidden" name="name"          value={name} />
            <input type="hidden" name="email"         value={email} />
            <input type="hidden" name="phone"         value={phone} />
            <input type="hidden" name="website"       value={website} />
            <input type="hidden" name="address_line1" value={address1} />
            <input type="hidden" name="address_line2" value={address2} />
            <input type="hidden" name="city"          value={city} />
            <input type="hidden" name="state"         value={stateVal} />
            <input type="hidden" name="pincode"       value={pincode} />
            <input type="hidden" name="description"   value={description} />
            {clinicType && <input type="hidden" name="clinic_type" value={clinicType} />}

            {/* Departments as repeated hidden inputs */}
            {module === 'hospital' && allDepts
              .filter(d => selectedDepts.has(d))
              .map(d => <input key={d} type="hidden" name="departments[]" value={d} />)
            }

            {/* Services as repeated hidden inputs: "name|homeCollection" */}
            {(module === 'diagnostic' || module === 'clinic') && services.map(s => (
              <input key={s.name} type="hidden" name="services[]"
                value={`${s.name}|${s.homeCollection}`} />
            ))}

            {/* ============================================================
                STEP 1 — Module + Basic Info
            ============================================================ */}
            {step === 1 && (
              <div className="step">
                <h2 className="step-title">Select facility type</h2>
                <div className="module-options">
                  {MODULES.map(m => (
                    <label key={m.value} className={`module-option ${module === m.value ? 'is-selected' : ''}`}>
                      <input type="radio" name="_module_ui" value={m.value}
                        checked={module === m.value}
                        onChange={() => setModule(m.value as any)}
                        className="sr-only"
                      />
                      <span className="module-option__icon">{m.icon}</span>
                      <div>
                        <span className="module-option__label">{m.label}</span>
                        <span className="module-option__desc">{m.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>

                <h2 className="step-title" style={{ marginTop: 24 }}>Basic information</h2>
                <div className="field-grid">
                  <div className="form-field col-full">
                    <label className="form-field__label">Facility name <span className="req">*</span></label>
                    <input type="text" className="form-field__input"
                      value={name} onChange={e => setName(e.target.value)}
                      placeholder="e.g. Sunrise Multi-Specialty Hospital"
                      required maxLength={200} />
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">Email address <span className="req">*</span></label>
                    <input type="email" className="form-field__input"
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="info@yourhospital.com" required />
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">Phone number <span className="req">*</span></label>
                    <input type="tel" className="form-field__input"
                      value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="9876543210" required />
                  </div>
                  <div className="form-field col-full">
                    <label className="form-field__label">Website <span className="opt">(optional)</span></label>
                    <input type="url" className="form-field__input"
                      value={website} onChange={e => setWebsite(e.target.value)}
                      placeholder="https://yourhospital.com" />
                  </div>
                </div>

                <button
                  type="button"
                  className="next-btn"
                  onClick={handleStep1}
                  disabled={!name.trim() || !email.trim() || !phone.trim()}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* ============================================================
                STEP 2 — Module-specific details
            ============================================================ */}
            {step === 2 && (
              <div className="step">

                {/* ---- HOSPITAL: Departments ---- */}
                {module === 'hospital' && (
                  <>
                    <h2 className="step-title">Departments available</h2>
                    <p className="step-sub">All common departments are pre-selected. Uncheck any that your hospital doesn't have.</p>

                    <div className="dept-stats">
                      <span>{selectedDepts.size} departments selected</span>
                      <button type="button" className="select-all-btn"
                        onClick={() => setSelectedDepts(new Set(allDepts))}>
                        Select all
                      </button>
                      <button type="button" className="select-all-btn"
                        onClick={() => setSelectedDepts(new Set())}>
                        Clear all
                      </button>
                    </div>

                    <div className="dept-grid">
                      {allDepts.map(dept => (
                        <label key={dept} className={`dept-chip ${selectedDepts.has(dept) ? 'is-checked' : ''}`}>
                          <input type="checkbox"
                            checked={selectedDepts.has(dept)}
                            onChange={() => toggleDept(dept)}
                            className="sr-only"
                          />
                          <span className="dept-chip__check">{selectedDepts.has(dept) ? '✓' : ''}</span>
                          {dept}
                        </label>
                      ))}
                    </div>

                    <div className="custom-add">
                      <label className="form-field__label">Add custom department</label>
                      <div className="custom-add__row">
                        <input
                          type="text"
                          className="form-field__input"
                          value={customDeptInput}
                          onChange={e => setCustomDeptInput(e.target.value)}
                          placeholder="e.g. Sports Medicine"
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomDept())}
                          maxLength={100}
                        />
                        <button type="button" className="add-btn" onClick={addCustomDept}>
                          + Add
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* ---- DIAGNOSTIC CENTRE: Services ---- */}
                {module === 'diagnostic' && (
                  <>
                    <h2 className="step-title">Services offered</h2>
                    <p className="step-sub">
                      Select all tests and services your centre provides.
                      Toggle 🏠 for services available as home collection.
                    </p>

                    {DIAGNOSTIC_SERVICES.map(category => (
                      <div key={category.category} className="service-category">
                        <h3 className="service-category__title">{category.category}</h3>
                        <div className="service-list">
                          {category.tests.map(test => {
                            const selected = isServiceSelected(test)
                            const home    = isHomeCollection(test)
                            return (
                              <div key={test} className={`service-row ${selected ? 'is-selected' : ''}`}>
                                <label className="service-row__check">
                                  <input type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleService(test)}
                                    className="sr-only"
                                  />
                                  <span className="service-check">{selected ? '✓' : ''}</span>
                                  <span className="service-name">{test}</span>
                                </label>
                                {selected && (
                                  <button
                                    type="button"
                                    className={`home-toggle ${home ? 'is-on' : ''}`}
                                    onClick={() => toggleHomeCollection(test)}
                                    title={home ? 'Home collection available' : 'No home collection'}
                                  >
                                    🏠 {home ? 'Home collection' : 'No home collection'}
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="custom-add">
                      <label className="form-field__label">Add custom test / service</label>
                      <div className="custom-add__row">
                        <input
                          type="text"
                          className="form-field__input"
                          value={customServiceInput}
                          onChange={e => setCustomServiceInput(e.target.value)}
                          placeholder="e.g. Hair Analysis, Allergy Test"
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomService())}
                          maxLength={100}
                        />
                        <button type="button" className="add-btn" onClick={addCustomService}>
                          + Add
                        </button>
                      </div>
                      {services.filter(s => !DIAGNOSTIC_SERVICES.flatMap(c => c.tests).includes(s.name)).map(s => (
                        <div key={s.name} className="custom-service-tag">
                          <span>{s.name}</span>
                          <button type="button"
                            className={`home-toggle ${s.homeCollection ? 'is-on' : ''}`}
                            onClick={() => toggleHomeCollection(s.name)}
                          >
                            🏠 {s.homeCollection ? 'Home collection' : 'No home collection'}
                          </button>
                          <button type="button" className="remove-btn"
                            onClick={() => setServices(prev => prev.filter(x => x.name !== s.name))}>
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="selected-summary">
                      {services.length} services selected
                      {services.filter(s => s.homeCollection).length > 0 &&
                        ` · ${services.filter(s => s.homeCollection).length} with home collection`}
                    </div>
                  </>
                )}

                {/* ---- CLINIC: Type + Services ---- */}
                {module === 'clinic' && (
                  <>
                    <h2 className="step-title">Clinic type <span className="req">*</span></h2>
                    <p className="step-sub">Select the type that best describes your clinic.</p>
                    <div className="clinic-type-grid">
                      {CLINIC_TYPES.map(type => (
                        <label key={type} className={`clinic-type-chip ${clinicType === type ? 'is-selected' : ''}`}>
                          <input type="radio"
                            checked={clinicType === type}
                            onChange={() => setClinicType(type)}
                            className="sr-only"
                          />
                          {type}
                        </label>
                      ))}
                    </div>

                    <h2 className="step-title" style={{ marginTop: 24 }}>Services offered</h2>
                    <p className="step-sub">Select services your clinic provides.</p>
                    <div className="dept-grid">
                      {CLINIC_SERVICES.map(service => {
                        const selected = isServiceSelected(service)
                        return (
                          <label key={service} className={`dept-chip ${selected ? 'is-checked' : ''}`}>
                            <input type="checkbox"
                              checked={selected}
                              onChange={() => toggleService(service)}
                              className="sr-only"
                            />
                            <span className="dept-chip__check">{selected ? '✓' : ''}</span>
                            {service}
                          </label>
                        )
                      })}
                    </div>

                    <div className="custom-add">
                      <label className="form-field__label">Add custom service</label>
                      <div className="custom-add__row">
                        <input
                          type="text"
                          className="form-field__input"
                          value={customServiceInput}
                          onChange={e => setCustomServiceInput(e.target.value)}
                          placeholder="e.g. Laser Treatment, Counselling"
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomService())}
                          maxLength={100}
                        />
                        <button type="button" className="add-btn" onClick={addCustomService}>+ Add</button>
                      </div>
                      {services.filter(s => !CLINIC_SERVICES.includes(s.name)).map(s => (
                        <div key={s.name} className="custom-service-tag">
                          <span>{s.name}</span>
                          <button type="button" className="remove-btn"
                            onClick={() => setServices(prev => prev.filter(x => x.name !== s.name))}>✕</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="step-nav">
                  <button type="button" className="back-btn" onClick={() => setStep(1)}>← Back</button>
                  <button
                    type="button"
                    className="next-btn"
                    onClick={handleStep2}
                    disabled={module === 'clinic' && !clinicType}
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================
                STEP 3 — Address + Description + Submit
            ============================================================ */}
            {step === 3 && (
              <div className="step">
                <h2 className="step-title">Address</h2>
                <div className="field-grid">
                  <div className="form-field col-full">
                    <label className="form-field__label">Street address <span className="req">*</span></label>
                    <input type="text" className="form-field__input"
                      value={address1} onChange={e => setAddress1(e.target.value)}
                      placeholder="Building name, street" required maxLength={200} />
                  </div>
                  <div className="form-field col-full">
                    <label className="form-field__label">Landmark / Area <span className="opt">(optional)</span></label>
                    <input type="text" className="form-field__input"
                      value={address2} onChange={e => setAddress2(e.target.value)}
                      placeholder="Near temple, MG Road" maxLength={200} />
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">City <span className="req">*</span></label>
                    <input type="text" className="form-field__input"
                      value={city} onChange={e => setCity(e.target.value)}
                      placeholder="Kochi" required maxLength={100} />
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">State <span className="req">*</span></label>
                    <select className="form-field__input" value={stateVal}
                      onChange={e => setStateVal(e.target.value)} required>
                      <option value="">Select state…</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-field__label">Pincode <span className="req">*</span></label>
                    <input type="text" className="form-field__input"
                      value={pincode} onChange={e => setPincode(e.target.value)}
                      placeholder="682001" required maxLength={6} pattern="\d{6}" />
                  </div>
                </div>

                <h2 className="step-title" style={{ marginTop: 20 }}>
                  About your facility <span className="opt">(optional)</span>
                </h2>
                <textarea className="form-field__textarea"
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Tell patients about your facility, specialties, and services…"
                  rows={4} maxLength={1000} />

                {/* Summary */}
                <div className="submit-summary">
                  <div className="summary-item">
                    <span>Facility</span>
                    <strong>{name}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Type</span>
                    <strong>{MODULES.find(m => m.value === module)?.label}</strong>
                  </div>
                  {module === 'hospital' && (
                    <div className="summary-item">
                      <span>Departments</span>
                      <strong>{selectedDepts.size} selected</strong>
                    </div>
                  )}
                  {(module === 'diagnostic' || module === 'clinic') && (
                    <div className="summary-item">
                      <span>Services</span>
                      <strong>{services.length} selected</strong>
                    </div>
                  )}
                  {module === 'clinic' && clinicType && (
                    <div className="summary-item">
                      <span>Clinic type</span>
                      <strong>{clinicType}</strong>
                    </div>
                  )}
                </div>

                <p className="form-note">
                  By submitting you agree to our <a href="/terms" className="form-link">Terms of Service</a>.
                  Our team will review your application within 2 business days.
                </p>

                <div className="step-nav">
                  <button type="button" className="back-btn" onClick={() => setStep(2)}>← Back</button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={!address1.trim() || !city.trim() || !stateVal || !pincode.trim()}
                  >
                    Submit registration →
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <style>{`
        :root {
          --myop-teal:      #0d9488;
          --myop-teal-dark: #0f766e;
          --myop-teal-light:#ccfbf1;
          --myop-slate:     #0f172a;
          --myop-muted:     #64748b;
          --myop-border:    #e2e8f0;
          --myop-error:     #ef4444;
          --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans','Segoe UI',system-ui,sans-serif; color: var(--myop-slate); background: #f8fafc; -webkit-font-smoothing: antialiased; }
        .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }

        .register-shell { min-height: 100dvh; }
        .register-header { background: #fff; border-bottom: 1px solid var(--myop-border); padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
        .register-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; }
        .logo-mark { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: var(--myop-teal); color: #fff; font-size: 14px; font-weight: 800; border-radius: 6px; }
        .logo-text { font-size: 15px; font-weight: 700; color: var(--myop-slate); }
        .header-login { font-size: 13px; color: var(--myop-teal); font-weight: 500; text-decoration: none; }
        .header-login:hover { text-decoration: underline; }

        .register-body { display: grid; grid-template-columns: 320px 1fr; gap: 0; max-width: 1100px; margin: 0 auto; padding: 48px 24px; align-items: start; }
        @media (max-width: 860px) { .register-body { grid-template-columns: 1fr; } .register-intro { margin-bottom: 32px; } }

        .register-intro { padding-right: 48px; position: sticky; top: 80px; }
        .register-intro__title { font-size: 30px; font-weight: 800; color: var(--myop-slate); line-height: 1.15; letter-spacing: -1px; margin-bottom: 16px; }
        .register-intro__title em { font-style: normal; color: var(--myop-teal); }
        .register-intro__sub { font-size: 14px; color: var(--myop-muted); line-height: 1.6; margin-bottom: 20px; }
        .register-intro__benefits { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .register-intro__benefits li { font-size: 13px; color: var(--myop-slate); font-weight: 500; }

        .register-form-card { background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-lg); overflow: hidden; }

        .progress-bar { height: 4px; background: #f1f5f9; }
        .progress-bar__fill { height: 100%; background: var(--myop-teal); transition: width 0.3s ease; }
        .progress-steps { display: flex; padding: 16px 24px 0; gap: 0; border-bottom: 1px solid var(--myop-border); }
        .progress-step { display: flex; align-items: center; gap: 6px; padding-bottom: 12px; flex: 1; font-size: 12px; font-weight: 500; color: var(--myop-muted); border-bottom: 2px solid transparent; margin-bottom: -1px; }
        .progress-step.active { color: var(--myop-teal); border-bottom-color: var(--myop-teal); }
        .progress-step.done { color: var(--myop-teal); }
        .progress-step__num { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: #f1f5f9; font-size: 10px; font-weight: 700; flex-shrink: 0; }
        .progress-step.active .progress-step__num { background: var(--myop-teal); color: #fff; }
        .progress-step.done .progress-step__num { background: var(--myop-teal); color: #fff; }

        .alert { margin: 16px 24px 0; padding: 12px 14px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; }
        .alert--error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

        .step { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .step-title { font-size: 15px; font-weight: 700; color: var(--myop-slate); }
        .step-sub { font-size: 13px; color: var(--myop-muted); line-height: 1.5; margin-top: -8px; }

        .module-options { display: flex; flex-direction: column; gap: 8px; }
        .module-option { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border: 1.5px solid var(--myop-border); border-radius: var(--radius-md); cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .module-option.is-selected { border-color: var(--myop-teal); background: #f0fdfa; }
        .module-option__icon { font-size: 20px; flex-shrink: 0; }
        .module-option__label { display: block; font-size: 14px; font-weight: 600; color: var(--myop-slate); }
        .module-option__desc { display: block; font-size: 12px; color: var(--myop-muted); margin-top: 2px; }

        .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 560px) { .field-grid { grid-template-columns: 1fr; } }
        .col-full { grid-column: 1 / -1; }
        .form-field { display: flex; flex-direction: column; gap: 5px; }
        .form-field__label { font-size: 13px; font-weight: 600; color: var(--myop-slate); }
        .req { color: var(--myop-error); }
        .opt { font-weight: 400; color: var(--myop-muted); font-size: 11px; }
        .form-field__input { height: 40px; padding: 0 12px; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); font-size: 14px; color: var(--myop-slate); background: #fff; outline: none; font-family: inherit; width: 100%; transition: border-color 0.15s; }
        .form-field__input:focus { border-color: var(--myop-teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
        .form-field__textarea { padding: 10px 12px; width: 100%; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); font-size: 14px; font-family: inherit; resize: vertical; outline: none; transition: border-color 0.15s; }
        .form-field__textarea:focus { border-color: var(--myop-teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }

        /* Departments */
        .dept-stats { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--myop-muted); }
        .select-all-btn { background: none; border: 1px solid var(--myop-border); border-radius: 4px; padding: 3px 8px; font-size: 11px; color: var(--myop-muted); cursor: pointer; transition: all 0.15s; }
        .select-all-btn:hover { border-color: var(--myop-teal); color: var(--myop-teal); }
        .dept-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
        .dept-chip { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); cursor: pointer; font-size: 13px; color: var(--myop-muted); transition: all 0.15s; user-select: none; }
        .dept-chip.is-checked { border-color: var(--myop-teal); background: #f0fdfa; color: var(--myop-slate); font-weight: 500; }
        .dept-chip__check { width: 16px; height: 16px; border-radius: 3px; border: 1.5px solid var(--myop-border); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
        .dept-chip.is-checked .dept-chip__check { background: var(--myop-teal); border-color: var(--myop-teal); color: #fff; }

        /* Services */
        .service-category { display: flex; flex-direction: column; gap: 8px; }
        .service-category__title { font-size: 12px; font-weight: 700; color: var(--myop-muted); text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 0 4px; border-bottom: 1px solid #f1f5f9; }
        .service-list { display: flex; flex-direction: column; gap: 4px; }
        .service-row { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: var(--radius-sm); cursor: pointer; transition: background 0.15s; }
        .service-row:hover { background: #f8fafc; }
        .service-row.is-selected { background: #f0fdfa; }
        .service-row__check { display: flex; align-items: center; gap: 8px; flex: 1; font-size: 13px; color: var(--myop-muted); cursor: pointer; }
        .service-row.is-selected .service-row__check { color: var(--myop-slate); }
        .service-check { width: 16px; height: 16px; border-radius: 3px; border: 1.5px solid var(--myop-border); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
        .service-row.is-selected .service-check { background: var(--myop-teal); border-color: var(--myop-teal); color: #fff; }
        .home-toggle { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; border: 1px solid var(--myop-border); background: #fff; cursor: pointer; color: var(--myop-muted); white-space: nowrap; transition: all 0.15s; flex-shrink: 0; }
        .home-toggle.is-on { background: #ecfdf5; border-color: #6ee7b7; color: #065f46; font-weight: 600; }
        .selected-summary { font-size: 13px; color: var(--myop-muted); padding: 8px 12px; background: #f8fafc; border-radius: var(--radius-sm); border: 1px solid var(--myop-border); }

        /* Clinic type */
        .clinic-type-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
        .clinic-type-chip { display: flex; align-items: center; justify-content: center; padding: 9px 12px; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); cursor: pointer; font-size: 13px; color: var(--myop-muted); text-align: center; transition: all 0.15s; user-select: none; }
        .clinic-type-chip.is-selected { border-color: var(--myop-teal); background: #f0fdfa; color: var(--myop-teal); font-weight: 600; }

        /* Custom add */
        .custom-add { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: #f8fafc; border-radius: var(--radius-sm); border: 1px dashed var(--myop-border); }
        .custom-add__row { display: flex; gap: 8px; }
        .add-btn { height: 40px; padding: 0 14px; background: var(--myop-teal); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; flex-shrink: 0; transition: background 0.15s; }
        .add-btn:hover { background: var(--myop-teal-dark); }
        .custom-service-tag { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-sm); font-size: 13px; }
        .custom-service-tag span { flex: 1; }
        .remove-btn { background: none; border: none; color: var(--myop-muted); cursor: pointer; font-size: 14px; padding: 0 4px; transition: color 0.15s; }
        .remove-btn:hover { color: var(--myop-error); }

        /* Submit summary */
        .submit-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 14px; background: #f8fafc; border-radius: var(--radius-sm); border: 1px solid var(--myop-border); }
        .summary-item { display: flex; flex-direction: column; gap: 2px; }
        .summary-item span { font-size: 11px; color: var(--myop-muted); text-transform: uppercase; letter-spacing: 0.4px; }
        .summary-item strong { font-size: 14px; color: var(--myop-slate); }

        /* Navigation */
        .step-nav { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-top: 4px; }
        .back-btn { height: 40px; padding: 0 16px; background: #f1f5f9; color: var(--myop-slate); border: 1px solid var(--myop-border); border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
        .back-btn:hover { background: #e2e8f0; }
        .next-btn, .submit-btn { height: 44px; padding: 0 24px; background: var(--myop-teal); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.15s, opacity 0.15s; }
        .next-btn:hover:not(:disabled), .submit-btn:hover:not(:disabled) { background: var(--myop-teal-dark); }
        .next-btn:disabled, .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .form-note { font-size: 12px; color: var(--myop-muted); line-height: 1.5; }
        .form-link { color: var(--myop-teal); text-decoration: none; }
        .form-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  )
}