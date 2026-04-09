/**
 * app/(admin)/admin/dashboard/page.tsx
 * MYOP Healthcare Marketplace — Admin Dashboard
 * Phase 3: Real stats from database
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch all stats in parallel
  const [
    { count: totalHospitals },
    { count: pendingHospitals },
    { count: approvedHospitals },
    { count: suspendedHospitals },
    { count: totalStaff },
  ] = await Promise.all([
    (supabase as any).from('hospitals').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    (supabase as any).from('hospitals').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending').is('deleted_at', null),
    (supabase as any).from('hospitals').select('id', { count: 'exact', head: true }).eq('approval_status', 'approved').is('deleted_at', null),
    (supabase as any).from('hospitals').select('id', { count: 'exact', head: true }).eq('approval_status', 'suspended').is('deleted_at', null),
    (supabase as any).from('user_profiles').select('id', { count: 'exact', head: true }).eq('role', 'hospital_staff').is('deleted_at', null),
  ])

  // Recent pending registrations
  const { data: recentPending } = await (supabase as any)
    .from('hospitals')
    .select('id, name, module, city, state, created_at, email')
    .eq('approval_status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  const STAT_CARDS = [
    { label: 'Total hospitals',     value: totalHospitals ?? 0,    icon: '🏥', color: '#0d9488', href: '/admin/hospitals' },
    { label: 'Pending approval',    value: pendingHospitals ?? 0,   icon: '⏳', color: '#f59e0b', href: '/admin/hospitals/pending' },
    { label: 'Approved & active',   value: approvedHospitals ?? 0,  icon: '✅', color: '#22c55e', href: '/admin/hospitals?status=approved' },
    { label: 'Suspended',           value: suspendedHospitals ?? 0, icon: '🚫', color: '#ef4444', href: '/admin/hospitals?status=suspended' },
    { label: 'Hospital staff',      value: totalStaff ?? 0,         icon: '👥', color: '#6366f1', href: '/admin/staff' },
  ]

  const MODULE_LABELS: Record<string, string> = {
    hospital:   'Hospital',
    diagnostic: 'Diagnostic Centre',
    clinic:     'Clinic',
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Overview</h1>
          <p className="page-sub">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {(pendingHospitals ?? 0) > 0 && (
          <Link href="/admin/hospitals/pending" className="pending-cta">
            <span>⏳</span>
            {pendingHospitals} pending {pendingHospitals === 1 ? 'application' : 'applications'}
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {STAT_CARDS.map(({ label, value, icon, color, href }) => (
          <Link key={label} href={href} className="stat-card">
            <div className="stat-card__icon" style={{ background: `${color}18`, color }}>
              {icon}
            </div>
            <div className="stat-card__body">
              <span className="stat-card__value">{value}</span>
              <span className="stat-card__label">{label}</span>
            </div>
            <span className="stat-card__arrow">→</span>
          </Link>
        ))}
      </div>

      {/* Recent pending applications */}
      <section className="section">
        <div className="section__header">
          <h2 className="section__title">Recent applications</h2>
          <Link href="/admin/hospitals/pending" className="section__link">
            View all →
          </Link>
        </div>

        {!recentPending || recentPending.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">✅</span>
            <p>No pending applications</p>
            <span>All hospital registrations have been reviewed.</span>
          </div>
        ) : (
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Applied</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentPending.map((h: any) => (
                  <tr key={h.id}>
                    <td>
                      <div className="table-name">{h.name}</div>
                      <div className="table-sub">{h.email}</div>
                    </td>
                    <td>
                      <span className={`module-badge module-badge--${h.module}`}>
                        {MODULE_LABELS[h.module]}
                      </span>
                    </td>
                    <td className="table-location">{h.city}, {h.state}</td>
                    <td className="table-date">
                      {new Date(h.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <Link href={`/admin/hospitals/${h.id}`} className="review-btn">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>{`
        .page-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px;
          margin-bottom: 28px; flex-wrap: wrap;
        }
        .page-title {
          font-size: 24px; font-weight: 700;
          color: var(--myop-slate); letter-spacing: -0.5px;
        }
        .page-sub { font-size: 13px; color: var(--myop-muted); margin-top: 4px; }
        .pending-cta {
          display: flex; align-items: center; gap: 8px;
          background: #fef3c7; border: 1px solid #fcd34d;
          color: #92400e; border-radius: var(--radius-sm);
          padding: 8px 14px; font-size: 13px; font-weight: 600;
          text-decoration: none; white-space: nowrap;
          transition: background 0.15s;
        }
        .pending-cta:hover { background: #fde68a; }

        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 14px; margin-bottom: 32px;
        }
        .stat-card {
          display: flex; align-items: center; gap: 14px;
          background: #fff; border: 1px solid var(--myop-border);
          border-radius: var(--radius-md); padding: 18px;
          text-decoration: none;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
        }
        .stat-card:hover {
          border-color: var(--myop-teal);
          box-shadow: 0 2px 12px rgba(13,148,136,0.1);
          transform: translateY(-1px);
        }
        .stat-card__icon {
          width: 42px; height: 42px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .stat-card__body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .stat-card__value {
          font-size: 24px; font-weight: 800;
          color: var(--myop-slate); letter-spacing: -0.5px; line-height: 1;
        }
        .stat-card__label { font-size: 12px; color: var(--myop-muted); }
        .stat-card__arrow { color: var(--myop-muted); font-size: 16px; opacity: 0; transition: opacity 0.15s; }
        .stat-card:hover .stat-card__arrow { opacity: 1; color: var(--myop-teal); }

        .section { margin-bottom: 32px; }
        .section__header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px;
        }
        .section__title {
          font-size: 16px; font-weight: 700;
          color: var(--myop-slate); letter-spacing: -0.3px;
        }
        .section__link {
          font-size: 13px; color: var(--myop-teal); font-weight: 500;
          text-decoration: none; transition: color 0.15s;
        }
        .section__link:hover { color: var(--myop-teal-dark); }

        .table-card {
          background: #fff; border: 1px solid var(--myop-border);
          border-radius: var(--radius-md); overflow: hidden;
        }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th {
          padding: 10px 16px; text-align: left;
          font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
          text-transform: uppercase; color: var(--myop-muted);
          background: #f8fafc; border-bottom: 1px solid var(--myop-border);
        }
        .data-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px; color: var(--myop-slate);
        }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:hover td { background: #fafafa; }

        .table-name { font-weight: 600; font-size: 14px; }
        .table-sub { font-size: 12px; color: var(--myop-muted); margin-top: 2px; }
        .table-location { color: var(--myop-muted); font-size: 13px; }
        .table-date { color: var(--myop-muted); font-size: 13px; white-space: nowrap; }

        .module-badge {
          display: inline-flex; align-items: center;
          padding: 3px 8px; border-radius: 4px;
          font-size: 11px; font-weight: 600;
        }
        .module-badge--hospital   { background: #eff6ff; color: #1d4ed8; }
        .module-badge--diagnostic { background: #f0fdf4; color: #15803d; }
        .module-badge--clinic     { background: #fdf4ff; color: #7e22ce; }

        .review-btn {
          display: inline-flex; align-items: center;
          padding: 5px 12px; border-radius: var(--radius-sm);
          font-size: 12px; font-weight: 600;
          background: var(--myop-teal); color: #fff;
          text-decoration: none;
          transition: background 0.15s;
        }
        .review-btn:hover { background: var(--myop-teal-dark); }

        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          gap: 6px; padding: 40px;
          background: #fff; border: 1.5px dashed var(--myop-border);
          border-radius: var(--radius-md); text-align: center;
        }
        .empty-state__icon { font-size: 28px; margin-bottom: 4px; }
        .empty-state p { font-size: 14px; font-weight: 600; color: var(--myop-slate); }
        .empty-state span { font-size: 13px; color: var(--myop-muted); }
      `}</style>
    </>
  )
}