/**
 * app/(hospital)/hospital/appointments/page.tsx
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getStaffHospital } from '@/lib/hospital/actions'

export const metadata: Metadata = { title: 'Appointments' }

interface Props {
  searchParams: Promise<{ filter?: string; date?: string }>
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  pending:   { bg: '#fef3c7', color: '#92400e' },
  confirmed: { bg: '#dbeafe', color: '#1e40af' },
  paid:      { bg: '#dcfce7', color: '#166534' },
  scheduled: { bg: '#f0fdf4', color: '#15803d' },
  completed: { bg: '#f1f5f9', color: '#475569' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
  refunded:  { bg: '#fdf4ff', color: '#7e22ce' },
}

const FILTERS = [
  { value: '',        label: 'All' },
  { value: 'today',   label: 'Today' },
  { value: 'pending', label: 'Pending' },
  { value: 'upcoming', label: 'Upcoming' },
]

export default async function AppointmentsPage({ searchParams }: Props) {
  const params = await searchParams
  const filter = params.filter ?? ''
  const staff = await getStaffHospital()
  if (!staff) redirect('/auth/login')

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const now   = new Date().toISOString()

  let query = (supabase as any)
    .from('appointments')
    .select(`
      id, status, scheduled_at, module, created_at,
      user_profiles(full_name),
      doctors(full_name, specialisation),
      services(name)
    `)
    .eq('hospital_id', staff.hospitalId)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: false })
    .limit(50)

  if (filter === 'today') {
    query = query
      .gte('scheduled_at', `${today}T00:00:00`)
      .lte('scheduled_at', `${today}T23:59:59`)
  } else if (filter === 'pending') {
    query = query.eq('status', 'pending')
  } else if (filter === 'upcoming') {
    query = query
      .gte('scheduled_at', now)
      .in('status', ['pending', 'confirmed', 'paid', 'scheduled'])
  }

  const { data: appointments } = await query

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-sub">{(appointments ?? []).length} shown</p>
        </div>
      </div>

      <div className="filter-tabs">
        {FILTERS.map(f => (
          <a
            key={f.value}
            href={f.value ? `/hospital/appointments?filter=${f.value}` : '/hospital/appointments'}
            className={`filter-tab ${filter === f.value ? 'is-active' : ''}`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {!appointments || appointments.length === 0 ? (
        <div className="empty-state">
          <span>📋</span>
          <p>No appointments found</p>
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
              {appointments.map((a: any) => {
                const style = STATUS_STYLES[a.status] ?? STATUS_STYLES.pending
                const doctorOrService = a.doctors?.full_name
                  ? `${a.doctors.full_name} · ${a.doctors.specialisation}`
                  : a.services?.name ?? '—'
                return (
                  <tr key={a.id}>
                    <td>
                      <span className="table-name">
                        {a.user_profiles?.full_name ?? 'Patient'}
                      </span>
                    </td>
                    <td className="table-muted">{doctorOrService}</td>
                    <td className="table-muted">
                      {a.scheduled_at
                        ? new Date(a.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                        : '—'}
                    </td>
                    <td>
                      <span className="status-badge"
                        style={{ background: style.bg, color: style.color }}>
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

      <style>{`
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
        .page-title { font-size: 22px; font-weight: 700; color: var(--myop-slate); letter-spacing: -0.4px; }
        .page-sub { font-size: 13px; color: var(--myop-muted); margin-top: 3px; }

        .filter-tabs { display: flex; gap: 2px; margin-bottom: 20px; border-bottom: 1px solid var(--myop-border); }
        .filter-tab { padding: 8px 14px; font-size: 13px; font-weight: 500; color: var(--myop-muted); text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 0.15s; white-space: nowrap; }
        .filter-tab:hover { color: var(--myop-slate); }
        .filter-tab.is-active { color: var(--myop-teal); border-bottom-color: var(--myop-teal); }

        .table-card { background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-md); overflow: hidden; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: var(--myop-muted); background: #f8fafc; border-bottom: 1px solid var(--myop-border); }
        .data-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:hover td { background: #fafafa; }
        .table-name { font-weight: 600; color: var(--myop-slate); }
        .table-muted { color: var(--myop-muted); font-size: 13px; }
        .status-badge { display: inline-flex; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: capitalize; }

        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 60px; background: #fff; border: 1.5px dashed var(--myop-border); border-radius: var(--radius-md); text-align: center; }
        .empty-state span:first-child { font-size: 36px; }
        .empty-state p { font-size: 16px; font-weight: 700; color: var(--myop-slate); }
        .empty-state span { font-size: 13px; color: var(--myop-muted); }
      `}</style>
    </>
  )
}