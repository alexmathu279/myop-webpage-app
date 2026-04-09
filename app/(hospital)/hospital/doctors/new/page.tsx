/**
 * app/(hospital)/hospital/doctors/new/page.tsx
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStaffHospital, createDoctor } from '@/lib/hospital/actions'
import DoctorForm from '../doctor-form'

export const metadata: Metadata = { title: 'Add Doctor' }

export default async function NewDoctorPage() {
  const staff = await getStaffHospital()
  if (!staff) redirect('/auth/login')

  const supabase = await createClient()
  const { data: departments } = await (supabase as any)
    .from('departments')
    .select('id, name')
    .eq('hospital_id', staff.hospitalId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return (
    <>
      <div className="page-header">
        <a href="/hospital/doctors" className="back-link">← Back to doctors</a>
        <h1 className="page-title">Add doctor</h1>
      </div>
      <div className="form-card">
        <DoctorForm action={createDoctor} departments={departments ?? []} />
      </div>
      <style>{`
        .page-header { margin-bottom: 24px; }
        .back-link { font-size: 13px; color: var(--myop-muted); text-decoration: none; display: inline-block; margin-bottom: 8px; transition: color 0.15s; }
        .back-link:hover { color: var(--myop-slate); }
        .page-title { font-size: 22px; font-weight: 700; color: var(--myop-slate); letter-spacing: -0.4px; }
        .form-card { background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-lg); padding: 28px; max-width: 800px; }
      `}</style>
    </>
  )
}