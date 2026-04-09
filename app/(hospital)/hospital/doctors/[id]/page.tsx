/**
 * app/(hospital)/hospital/doctors/[id]/page.tsx
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getStaffHospital, updateDoctor, deleteDoctor } from '@/lib/hospital/actions'
import DoctorForm from '../doctor-form'
import DeleteDoctorButton from './delete-button'

export const metadata: Metadata = { title: 'Edit Doctor' }

interface Props { params: Promise<{ id: string }> }

export default async function DoctorDetailPage({ params }: Props) {
  const { id } = await params
  const staff = await getStaffHospital()
  if (!staff) redirect('/auth/login')

  const supabase = await createClient()

  const [{ data: doctor }, { data: departments }] = await Promise.all([
    (supabase as any)
      .from('doctors')
      .select('id, full_name, specialisation, qualification, registration_number, experience_years, consultation_fee, gender, bio, languages, department_id, is_active')
      .eq('id', id)
      .eq('hospital_id', staff.hospitalId)
      .is('deleted_at', null)
      .single(),
    (supabase as any)
      .from('departments')
      .select('id, name')
      .eq('hospital_id', staff.hospitalId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name', { ascending: true }),
  ])

  if (!doctor) redirect('/hospital/doctors')

  return (
    <>
      <div className="page-header">
        <a href="/hospital/doctors" className="back-link">← Back to doctors</a>
        <div className="page-header__title-row">
          <h1 className="page-title">{doctor.full_name}</h1>
          <div className="header-actions">
            <Link href={`/hospital/doctors/${id}/schedules`} className="schedule-btn">
              🗓 Manage schedules
            </Link>
            <DeleteDoctorButton doctorId={id} />
          </div>
        </div>
      </div>

      <div className="form-card">
        <DoctorForm action={updateDoctor} departments={departments ?? []} doctor={doctor} />
      </div>

      <style>{`
        .page-header { margin-bottom: 24px; }
        .back-link { font-size: 13px; color: var(--myop-muted); text-decoration: none; display: inline-block; margin-bottom: 8px; transition: color 0.15s; }
        .back-link:hover { color: var(--myop-slate); }
        .page-header__title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .page-title { font-size: 22px; font-weight: 700; color: var(--myop-slate); letter-spacing: -0.4px; }
        .header-actions { display: flex; gap: 8px; align-items: center; }
        .schedule-btn { display: inline-flex; align-items: center; height: 36px; padding: 0 14px; background: rgba(13,148,136,0.1); color: var(--myop-teal); border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; text-decoration: none; transition: background 0.15s; }
        .schedule-btn:hover { background: rgba(13,148,136,0.2); }
        .delete-btn { height: 36px; padding: 0 14px; background: #fff; color: var(--myop-error); border: 1px solid #fecaca; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .delete-btn:hover { background: #fee2e2; }
        .form-card { background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-lg); padding: 28px; max-width: 800px; }
      `}</style>
    </>
  )
}