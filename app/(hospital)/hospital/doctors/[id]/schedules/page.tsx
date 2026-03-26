'use client'

/**
 * app/(hospital)/hospital/doctors/[id]/schedules/page.tsx
 * Weekly schedule management + slot generation + date blocking
 */

import { useActionState, useState, useEffect } from 'react'
import { upsertSchedule, deleteSchedule, generateSlots, blockDate } from '@/lib/hospital/actions'
import type { ActionResult } from '@/types/dto'

const initialState: ActionResult = { success: true, data: undefined }

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SLOT_DURATIONS = [5, 10, 15, 20, 30, 45, 60]

interface Schedule {
  id:                 string
  day_of_week:        number
  start_time:         string
  end_time:           string
  slot_duration_mins: number
  max_patients:       number
  effective_from:     string
  effective_until:    string | null
  is_active:          boolean
}

interface Slot {
  id:           string
  slot_start:   string
  slot_end:     string
  is_available: boolean
  is_blocked:   boolean
  booked_count: number
  max_bookings: number
}

interface Props {
  params: Promise<{ id: string }>
}

export default function SchedulesPage({ params }: Props) {
  const [doctorId, setDoctorId] = useState<string>('')
  const [doctorName, setDoctorName] = useState<string>('')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [upcomingSlots, setUpcomingSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null)

  const [scheduleState, scheduleAction] = useActionState<ActionResult, FormData>(upsertSchedule, initialState)

  useEffect(() => {
    params.then(p => {
      setDoctorId(p.id)
      fetch(`/api/hospital/doctors/${p.id}`)
        .then(r => r.json())
        .then(data => {
          setDoctorName(data.full_name ?? 'Doctor')
          setSchedules(data.schedules ?? [])
          setUpcomingSlots(data.slots ?? [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    })
  }, [params])

  // Close form on success
  useEffect(() => {
    if (scheduleState.success && scheduleState !== initialState) {
      setShowAddForm(false)
      setEditSchedule(null)
      // Refresh data
      if (doctorId) {
        fetch(`/api/hospital/doctors/${doctorId}`)
          .then(r => r.json())
          .then(data => {
            setSchedules(data.schedules ?? [])
            setUpcomingSlots(data.slots ?? [])
          })
      }
    }
  }, [scheduleState])

  const today = new Date().toISOString().split('T')[0]

  if (loading) return <div className="loading">Loading schedules…</div>

  return (
    <>
      <div className="page-header">
        <div>
          <a href={`/hospital/doctors/${doctorId}`} className="back-link">← Back to doctor</a>
          <h1 className="page-title">Schedules — {doctorName}</h1>
        </div>
        <div className="header-actions">
          {schedules.length > 0 && (
            <form action={generateSlots}>
              <input type="hidden" name="doctor_id" value={doctorId} />
              <input type="hidden" name="days_ahead" value="14" />
              <button type="submit" className="generate-btn">
                ⚡ Generate slots (14 days)
              </button>
            </form>
          )}
          <button type="button" className="primary-btn"
            onClick={() => { setShowAddForm(true); setEditSchedule(null) }}>
            + Add schedule
          </button>
        </div>
      </div>

      {/* Schedule form */}
      {(showAddForm || editSchedule) && (
        <div className="schedule-form-card">
          <h2 className="card-title">{editSchedule ? 'Edit schedule' : 'Add weekly schedule'}</h2>
          {!scheduleState.success && (
            <div className="alert alert--error">⚠ {scheduleState.error}</div>
          )}
          <form action={scheduleAction} className="schedule-form">
            <input type="hidden" name="doctor_id" value={doctorId} />
            {editSchedule && <input type="hidden" name="schedule_id" value={editSchedule.id} />}

            <div className="field-grid">
              <div className="form-field">
                <label className="form-field__label">Day <span className="req">*</span></label>
                <select name="day_of_week" className="form-field__input" required
                  defaultValue={editSchedule?.day_of_week ?? 1}>
                  {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-field__label">Slot duration <span className="req">*</span></label>
                <select name="slot_duration_mins" className="form-field__input"
                  defaultValue={editSchedule?.slot_duration_mins ?? 15}>
                  {SLOT_DURATIONS.map(d => <option key={d} value={d}>{d} mins</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-field__label">Start time <span className="req">*</span></label>
                <input name="start_time" type="time" className="form-field__input"
                  defaultValue={editSchedule?.start_time?.slice(0, 5) ?? '09:00'} required />
              </div>
              <div className="form-field">
                <label className="form-field__label">End time <span className="req">*</span></label>
                <input name="end_time" type="time" className="form-field__input"
                  defaultValue={editSchedule?.end_time?.slice(0, 5) ?? '17:00'} required />
              </div>
              <div className="form-field">
                <label className="form-field__label">Max patients per slot</label>
                <input name="max_patients" type="number" min="1" max="100"
                  className="form-field__input"
                  defaultValue={editSchedule?.max_patients ?? 1} />
              </div>
              <div className="form-field">
                <label className="form-field__label">Effective from <span className="req">*</span></label>
                <input name="effective_from" type="date" className="form-field__input"
                  defaultValue={editSchedule?.effective_from ?? today} required />
              </div>
              <div className="form-field">
                <label className="form-field__label">Effective until <span className="opt">(leave blank = ongoing)</span></label>
                <input name="effective_until" type="date" className="form-field__input"
                  defaultValue={editSchedule?.effective_until ?? ''} />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">{editSchedule ? 'Update' : 'Add schedule'}</button>
              <button type="button" className="cancel-btn"
                onClick={() => { setShowAddForm(false); setEditSchedule(null) }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Weekly schedules */}
      <section className="section">
        <h2 className="section-title">Weekly schedule</h2>
        {schedules.length === 0 ? (
          <div className="empty-state">
            <span>📅</span>
            <p>No schedules yet</p>
            <span>Add a weekly schedule to start generating appointment slots.</span>
          </div>
        ) : (
          <div className="schedule-list">
            {schedules.map(s => {
              const slotsPerDay = Math.floor(
                (parseInt(s.end_time.split(':')[0]) * 60 + parseInt(s.end_time.split(':')[1]) -
                  parseInt(s.start_time.split(':')[0]) * 60 - parseInt(s.start_time.split(':')[1]))
                / s.slot_duration_mins
              )
              return (
                <div key={s.id} className={`schedule-row ${!s.is_active ? 'is-inactive' : ''}`}>
                  <div className="schedule-row__day">{DAYS[s.day_of_week]}</div>
                  <div className="schedule-row__time">
                    {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                  </div>
                  <div className="schedule-row__meta">
                    <span>{s.slot_duration_mins} min slots</span>
                    <span>~{slotsPerDay} slots/day</span>
                    <span>{s.max_patients} patient{s.max_patients > 1 ? 's' : ''}/slot</span>
                  </div>
                  <div className="schedule-row__dates">
                    From {new Date(s.effective_from).toLocaleDateString('en-IN')}
                    {s.effective_until ? ` until ${new Date(s.effective_until).toLocaleDateString('en-IN')}` : ' (ongoing)'}
                  </div>
                  <div className="schedule-row__actions">
                    <button type="button" className="icon-btn"
                      onClick={() => { setEditSchedule(s); setShowAddForm(false) }}>
                      ✎ Edit
                    </button>
                    <form action={deleteSchedule} style={{ display: 'inline' }}>
                      <input type="hidden" name="schedule_id" value={s.id} />
                      <input type="hidden" name="doctor_id" value={doctorId} />
                      <button type="submit" className="icon-btn icon-btn--danger"
                        onClick={e => { if (!confirm('Remove this schedule?')) e.preventDefault() }}>
                        ✕ Remove
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Block a date */}
      <section className="section">
        <h2 className="section-title">Block a date (if doctor is on leave today give today's date)</h2>
        <p className="section-sub">Block all slots on a specific date (e.g. holiday, leave).</p>
        <form action={blockDate} className="block-date-form">
          <input type="hidden" name="doctor_id" value={doctorId} />
          <input name="block_date" type="date" className="form-field__input"
            min={today} required />
          <button type="submit" className="block-btn">Block date</button>
        </form>
      </section>

      {/* Upcoming slots preview */}
      <section className="section">
        <h2 className="section-title">Upcoming slots (next 14 days)</h2>
        {upcomingSlots.length === 0 ? (
          <div className="empty-state">
            <span>⚡</span>
            <p>No slots generated yet</p>
            <span>Click "Generate slots" above to create slots from your weekly schedule.</span>
          </div>
        ) : (
          <div className="slots-grid">
            {upcomingSlots.slice(0, 42).map(slot => {
              const start = new Date(slot.slot_start)
              const isBooked = slot.booked_count >= slot.max_bookings
              return (
                <div key={slot.id}
                  className={`slot-chip ${slot.is_blocked ? 'is-blocked' : isBooked ? 'is-booked' : 'is-free'}`}
                  title={`${start.toLocaleDateString('en-IN')} ${start.toLocaleTimeString('en-IN', { timeStyle: 'short' })}`}
                >
                  <span className="slot-chip__date">
                    {start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="slot-chip__time">
                    {start.toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                  </span>
                  {slot.is_blocked && <span className="slot-chip__tag">Blocked</span>}
                  {isBooked && !slot.is_blocked && <span className="slot-chip__tag">Booked</span>}
                </div>
              )
            })}
            {upcomingSlots.length > 42 && (
              <div className="slot-chip slot-chip--more">+{upcomingSlots.length - 42} more</div>
            )}
          </div>
        )}
      </section>

      <style>{`
        .loading { padding: 40px; text-align: center; color: var(--myop-muted); font-size: 14px; }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .back-link { font-size: 13px; color: var(--myop-muted); text-decoration: none; display: inline-block; margin-bottom: 8px; }
        .back-link:hover { color: var(--myop-slate); }
        .page-title { font-size: 20px; font-weight: 700; color: var(--myop-slate); letter-spacing: -0.4px; }
        .header-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .primary-btn { display: inline-flex; align-items: center; height: 36px; padding: 0 14px; background: var(--myop-teal); color: #fff; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; text-decoration: none; border: none; cursor: pointer; transition: background 0.15s; }
        .primary-btn:hover { background: var(--myop-teal-dark); }
        .generate-btn { height: 36px; padding: 0 14px; background: #f0fdfa; color: var(--myop-teal); border: 1px solid rgba(13,148,136,0.3); border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .generate-btn:hover { background: #ccfbf1; }

        .schedule-form-card { background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-md); padding: 20px; margin-bottom: 20px; }
        .card-title { font-size: 15px; font-weight: 700; color: var(--myop-slate); margin-bottom: 16px; }
        .alert { padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; margin-bottom: 16px; }
        .alert--error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .schedule-form { display: flex; flex-direction: column; gap: 16px; }
        .field-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
        .form-field { display: flex; flex-direction: column; gap: 5px; }
        .form-field__label { font-size: 12px; font-weight: 600; color: var(--myop-slate); }
        .req { color: var(--myop-error); }
        .opt { font-weight: 400; color: var(--myop-muted); font-size: 10px; }
        .form-field__input { height: 38px; padding: 0 10px; border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm); font-size: 13px; color: var(--myop-slate); background: #fff; outline: none; font-family: inherit; width: 100%; transition: border-color 0.15s; }
        .form-field__input:focus { border-color: var(--myop-teal); }
        .form-actions { display: flex; align-items: center; gap: 10px; }
        .submit-btn { height: 38px; padding: 0 20px; background: var(--myop-teal); color: #fff; border: none; border-radius: var(--radius-sm); font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.15s; }
        .submit-btn:hover { background: var(--myop-teal-dark); }
        .cancel-btn { font-size: 13px; color: var(--myop-muted); background: none; border: none; cursor: pointer; }
        .cancel-btn:hover { color: var(--myop-slate); }

        .section { margin-bottom: 28px; }
        .section-title { font-size: 15px; font-weight: 700; color: var(--myop-slate); margin-bottom: 12px; }
        .section-sub { font-size: 13px; color: var(--myop-muted); margin-bottom: 10px; margin-top: -8px; }

        .schedule-list { display: flex; flex-direction: column; gap: 8px; }
        .schedule-row { display: flex; align-items: center; gap: 16px; background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-md); padding: 14px 16px; flex-wrap: wrap; }
        .schedule-row.is-inactive { opacity: 0.5; }
        .schedule-row__day { font-size: 14px; font-weight: 700; color: var(--myop-slate); min-width: 90px; }
        .schedule-row__time { font-size: 14px; color: var(--myop-teal); font-weight: 600; min-width: 120px; }
        .schedule-row__meta { display: flex; gap: 10px; font-size: 12px; color: var(--myop-muted); flex: 1; flex-wrap: wrap; }
        .schedule-row__dates { font-size: 12px; color: var(--myop-muted); }
        .schedule-row__actions { display: flex; gap: 6px; margin-left: auto; }
        .icon-btn { background: none; border: 1px solid var(--myop-border); border-radius: var(--radius-sm); padding: 4px 10px; font-size: 12px; color: var(--myop-muted); cursor: pointer; transition: all 0.15s; }
        .icon-btn:hover { background: #f1f5f9; color: var(--myop-slate); }
        .icon-btn--danger { color: var(--myop-error); }
        .icon-btn--danger:hover { background: #fee2e2; border-color: #fecaca; }

        .block-date-form { display: flex; gap: 8px; align-items: center; }
        .block-btn { height: 38px; padding: 0 16px; background: #fff; color: var(--myop-error); border: 1px solid #fecaca; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .block-btn:hover { background: #fee2e2; }

        .slots-grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .slot-chip { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px 10px; border-radius: var(--radius-sm); border: 1px solid; min-width: 80px; text-align: center; }
        .slot-chip.is-free { background: #f0fdf4; border-color: #bbf7d0; }
        .slot-chip.is-booked { background: #eff6ff; border-color: #bfdbfe; }
        .slot-chip.is-blocked { background: #f1f5f9; border-color: #cbd5e1; opacity: 0.6; }
        .slot-chip--more { background: #f8fafc; border-color: var(--myop-border); color: var(--myop-muted); font-size: 12px; }
        .slot-chip__date { font-size: 11px; color: var(--myop-muted); }
        .slot-chip__time { font-size: 12px; font-weight: 600; color: var(--myop-slate); }
        .slot-chip__tag { font-size: 10px; font-weight: 700; color: var(--myop-muted); margin-top: 2px; }

        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 32px; background: #fff; border: 1.5px dashed var(--myop-border); border-radius: var(--radius-md); text-align: center; }
        .empty-state span:first-child { font-size: 24px; }
        .empty-state p { font-size: 14px; font-weight: 600; color: var(--myop-slate); }
        .empty-state span { font-size: 13px; color: var(--myop-muted); }
      `}</style>
    </>
  )
}