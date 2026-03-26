/**
 * app/(hospital)/hospital/dashboard/page.tsx
 * Phase 4 — Staff dashboard with inline first-time setup
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getStaffHospital } from '@/lib/hospital/actions'
import type { UserRole } from '@/types/domain'
import StaffSetupForm from './setup-form'

export const metadata: Metadata = { title: 'Overview' }

const MODULE_ACTION: Record<string, string> = {
  hospital:   'Add doctor',
  diagnostic: 'Add service',
  clinic:     'Add service',
}
const MODULE_HREF: Record<string, string> = {
  hospital:   '/hospital/doctors/new',
  diagnostic: '/hospital/services/new',
  clinic:     '/hospital/services/new',
}

export default async function StaffDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, is_onboarded, role')
    .eq('id', user.id)
    .single<{ full_name: string; is_onboarded: boolean; role: UserRole }>()

  // Show setup form if not onboarded yet
  if (!profile?.is_onboarded) {
    return <StaffSetupForm currentName={profile?.full_name ?? ''} />
  }

  const staff = await getStaffHospital()
  if (!staff) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalDoctors },
    { count: totalServices },
    { count: todayAppts },
    { count: pendingAppts },
    { count: totalSlots },
    { data: upcomingAppts },
  ] = await Promise.all([
    (supabase as any).from('doctors').select('id', { count: 'exact', head: true }).eq('hospital_id', staff.hospitalId).eq('is_active', true).is('deleted_at', null),
    (supabase as any).from('services').select('id', { count: 'exact', head: true }).eq('hospital_id', staff.hospitalId).eq('is_active', true).is('deleted_at', null),
    (supabase as any).from('appointments').select('id', { count: 'exact', head: true }).eq('hospital_id', staff.hospitalId).gte('scheduled_at', `${today}T00:00:00`).lte('scheduled_at', `${today}T23:59:59`).is('deleted_at', null),
    (supabase as any).from('appointments').select('id', { count: 'exact', head: true }).eq('hospital_id', staff.hospitalId).eq('status', 'pending').is('deleted_at', null),
    (supabase as any).from('appointment_slots').select('id', { count: 'exact', head: true }).eq('hospital_id', staff.hospitalId).eq('is_available', true).eq('is_blocked', false).gte('slot_start', new Date().toISOString()).is('deleted_at', null),
    (supabase as any).from('appointments').select('id, status, scheduled_at, user_profiles(full_name), doctors(full_name, specialisation), services(name)').eq('hospital_id', staff.hospitalId).in('status', ['pending', 'confirmed', 'paid', 'scheduled']).order('scheduled_at', { ascending: true }).limit(5),
  ])

  const STAT_CARDS = [
    { label: "Today's appointments", value: todayAppts ?? 0,   icon: '📋', color: '#0d9488', href: '/hospital/appointments?filter=today' },
    { label: 'Pending confirmation', value: pendingAppts ?? 0, icon: '⏳', color: '#f59e0b', href: '/hospital/appointments?filter=pending' },
    { label: 'Available slots',      value: totalSlots ?? 0,   icon: '🗓', color: '#6366f1', href: '/hospital/doctors' },
    staff.module === 'hospital'
      ? { label: 'Active doctors', value: totalDoctors ?? 0,  icon: '👨‍⚕️', color: '#22c55e', href: '/hospital/doctors' }
      : { label: 'Services',       value: totalServices ?? 0, icon: '🧪', color: '#22c55e', href: '/hospital/services' },
  ]

  const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    pending:   { bg: '#fef3c7', color: '#92400e' },
    confirmed: { bg: '#dbeafe', color: '#1e40af' },
    paid:      { bg: '#dcfce7', color: '#166534' },
    scheduled: { bg: '#f0fdf4', color: '#15803d' },
    completed: { bg: '#f1f5f9', color: '#475569' },
    cancelled: { bg: '#fee2e2', color: '#991b1b' },
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-sub">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href={MODULE_HREF[staff.module]} className="primary-btn">
          + {MODULE_ACTION[staff.module]}
        </Link>
      </div>

      <div className="stat-grid">
        {STAT_CARDS.map(({ label, value, icon, color, href }) => (
          <Link key={label} href={href} className="stat-card">
            <div className="stat-card__icon" style={{ background: `${color}18`, color }}>{icon}</div>
            <div className="stat-card__body">
              <span className="stat-card__value">{value}</span>
              <span className="stat-card__label">{label}</span>
            </div>
          </Link>
        ))}
      </div>

      <section className="section">
        <div className="section__header">
          <h2 className="section__title">Upcoming appointments</h2>
          <Link href="/hospital/appointments" className="section__link">View all →</Link>
        </div>
        {!upcomingAppts || upcomingAppts.length === 0 ? (
          <div className="empty-state">
            <span>📅</span>
            <p>No upcoming appointments</p>
            <span>Appointments will appear here once patients start booking.</span>
          </div>
        ) : (
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor / Service</th>
                  <th>Scheduled</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAppts.map((a: any) => {
                  const style = STATUS_STYLES[a.status] ?? STATUS_STYLES.pending
                  const doctorOrService = a.doctors?.full_name
                    ? `${a.doctors.full_name} · ${a.doctors.specialisation}`
                    : a.services?.name ?? '—'
                  return (
                    <tr key={a.id}>
                      <td><span className="table-name">{a.user_profiles?.full_name ?? 'Patient'}</span></td>
                      <td className="table-muted">{doctorOrService}</td>
                      <td className="table-muted">
                        {a.scheduled_at
                          ? new Date(a.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                          : '—'}
                      </td>
                      <td>
                        <span className="status-badge" style={{ background: style.bg, color: style.color }}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>{`
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .page-title { font-size: 22px; font-weight: 700; color: var(--myop-slate); letter-spacing: -0.4px; }
        .page-sub { font-size: 13px; color: var(--myop-muted); margin-top: 3px; }
        .primary-btn { display: inline-flex; align-items: center; height: 38px; padding: 0 16px; background: var(--myop-teal); color: #fff; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; text-decoration: none; transition: background 0.15s; white-space: nowrap; }
        .primary-btn:hover { background: var(--myop-teal-dark); }
        .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; margin-bottom: 28px; }
        .stat-card { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-md); padding: 18px; text-decoration: none; transition: border-color 0.15s, transform 0.1s; }
        .stat-card:hover { border-color: var(--myop-teal); transform: translateY(-1px); }
        .stat-card__icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .stat-card__body { display: flex; flex-direction: column; gap: 2px; }
        .stat-card__value { font-size: 24px; font-weight: 800; color: var(--myop-slate); letter-spacing: -0.5px; line-height: 1; }
        .stat-card__label { font-size: 12px; color: var(--myop-muted); }
        .section { margin-bottom: 28px; }
        .section__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .section__title { font-size: 16px; font-weight: 700; color: var(--myop-slate); letter-spacing: -0.3px; }
        .section__link { font-size: 13px; color: var(--myop-teal); font-weight: 500; text-decoration: none; }
        .section__link:hover { color: var(--myop-teal-dark); }
        .table-card { background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-md); overflow: hidden; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: var(--myop-muted); background: #f8fafc; border-bottom: 1px solid var(--myop-border); }
        .data-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:hover td { background: #fafafa; }
        .table-name { font-weight: 600; }
        .table-muted { color: var(--myop-muted); font-size: 13px; }
        .status-badge { display: inline-flex; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: capitalize; }
        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 40px; background: #fff; border: 1.5px dashed var(--myop-border); border-radius: var(--radius-md); text-align: center; }
        .empty-state span:first-child { font-size: 28px; margin-bottom: 4px; }
        .empty-state p { font-size: 14px; font-weight: 600; color: var(--myop-slate); }
        .empty-state span { font-size: 13px; color: var(--myop-muted); }
      `}</style>
    </>
  )
}