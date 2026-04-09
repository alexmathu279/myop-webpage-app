/**
 * app/(hospital)/hospital/doctors/page.tsx
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getStaffHospital } from '@/lib/hospital/actions'

export const metadata: Metadata = { title: 'Doctors' }

export default async function DoctorsPage() {
  const staff = await getStaffHospital()
  if (!staff) redirect('/auth/login')
  if (staff.module === 'diagnostic') redirect('/hospital/services')

  const supabase = await createClient()

  const { data: doctors } = await (supabase as any)
    .from('doctors')
    .select('id, full_name, specialisation, qualification, experience_years, consultation_fee, is_active, departments(name)')
    .eq('hospital_id', staff.hospitalId)
    .is('deleted_at', null)
    .order('full_name', { ascending: true })

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Doctors</h1>
          <p className="page-sub">{(doctors ?? []).length} doctors registered</p>
        </div>
        <Link href="/hospital/doctors/new" className="primary-btn">+ Add doctor</Link>
      </div>

      {!doctors || doctors.length === 0 ? (
        <div className="empty-state">
          <span>👨‍⚕️</span>
          <p>No doctors yet</p>
          <span>Add your first doctor to start accepting appointments.</span>
          <Link href="/hospital/doctors/new" className="primary-btn" style={{ marginTop: 12 }}>
            + Add first doctor
          </Link>
        </div>
      ) : (
        <div className="doctor-grid">
          {doctors.map((doc: any) => (
            <div key={doc.id} className={`doctor-card ${!doc.is_active ? 'is-inactive' : ''}`}>
              <div className="doctor-card__avatar">
                {doc.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()}
              </div>
              <div className="doctor-card__body">
                <h3 className="doctor-card__name">{doc.full_name}</h3>
                <p className="doctor-card__spec">{doc.specialisation}</p>
                {doc.departments?.name && (
                  <p className="doctor-card__dept">{doc.departments.name}</p>
                )}
                <div className="doctor-card__meta">
                  <span>{doc.experience_years} yrs exp</span>
                  <span>₹{doc.consultation_fee}</span>
                  {!doc.is_active && <span className="inactive-tag">Inactive</span>}
                </div>
              </div>
              <div className="doctor-card__actions">
                <Link href={`/hospital/doctors/${doc.id}`} className="card-btn card-btn--edit">Edit</Link>
                <Link href={`/hospital/doctors/${doc.id}/schedules`} className="card-btn card-btn--schedule">Schedules</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .page-title { font-size: 22px; font-weight: 700; color: var(--myop-slate); letter-spacing: -0.4px; }
        .page-sub { font-size: 13px; color: var(--myop-muted); margin-top: 3px; }
        .primary-btn { display: inline-flex; align-items: center; height: 38px; padding: 0 16px; background: var(--myop-teal); color: #fff; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; text-decoration: none; transition: background 0.15s; }
        .primary-btn:hover { background: var(--myop-teal-dark); }

        .doctor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
        .doctor-card { background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-md); padding: 18px; display: flex; gap: 14px; align-items: flex-start; transition: border-color 0.15s; }
        .doctor-card:hover { border-color: var(--myop-teal); }
        .doctor-card.is-inactive { opacity: 0.6; }
        .doctor-card__avatar { width: 44px; height: 44px; min-width: 44px; border-radius: 50%; background: rgba(13,148,136,0.12); color: var(--myop-teal); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; }
        .doctor-card__body { flex: 1; min-width: 0; }
        .doctor-card__name { font-size: 15px; font-weight: 700; color: var(--myop-slate); margin-bottom: 2px; }
        .doctor-card__spec { font-size: 13px; color: var(--myop-teal); font-weight: 500; margin-bottom: 2px; }
        .doctor-card__dept { font-size: 12px; color: var(--myop-muted); margin-bottom: 6px; }
        .doctor-card__meta { display: flex; gap: 10px; font-size: 12px; color: var(--myop-muted); align-items: center; }
        .inactive-tag { background: #fee2e2; color: #991b1b; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 700; }
        .doctor-card__actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
        .card-btn { display: inline-flex; align-items: center; justify-content: center; height: 30px; padding: 0 12px; border-radius: var(--radius-sm); font-size: 12px; font-weight: 600; text-decoration: none; transition: background 0.15s; white-space: nowrap; }
        .card-btn--edit { background: #f1f5f9; color: var(--myop-slate); border: 1px solid var(--myop-border); }
        .card-btn--edit:hover { background: #e2e8f0; }
        .card-btn--schedule { background: rgba(13,148,136,0.1); color: var(--myop-teal); border: 1px solid rgba(13,148,136,0.2); }
        .card-btn--schedule:hover { background: rgba(13,148,136,0.2); }

        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 60px; background: #fff; border: 1.5px dashed var(--myop-border); border-radius: var(--radius-md); text-align: center; }
        .empty-state span:first-child { font-size: 36px; margin-bottom: 4px; }
        .empty-state p { font-size: 16px; font-weight: 700; color: var(--myop-slate); }
        .empty-state span { font-size: 13px; color: var(--myop-muted); }
      `}</style>
    </>
  )
}