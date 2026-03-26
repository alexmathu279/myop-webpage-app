/**
 * app/(admin)/admin/hospitals/page.tsx
 * MYOP Healthcare Marketplace
 *
 * Admin hospitals list — all hospitals with status filter tabs.
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Hospitals' }

interface Props {
  searchParams: Promise<{ status?: string; q?: string }>
}

const STATUS_TABS = [
  { value: '',          label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'approved',  label: 'Approved' },
  { value: 'rejected',  label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
]

const MODULE_LABELS: Record<string, string> = {
  hospital:   'Hospital',
  diagnostic: 'Diagnostic',
  clinic:     'Clinic',
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'status--pending',
  approved:  'status--approved',
  rejected:  'status--rejected',
  suspended: 'status--suspended',
}

export default async function AdminHospitalsPage({ searchParams }: Props) {
  const params = await searchParams
  const status = params.status ?? ''
  const query  = params.q ?? ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  let dbQuery = (supabase as any)
    .from('hospitals')
    .select('id, name, module, city, state, email, phone, approval_status, created_at, approved_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (status) dbQuery = dbQuery.eq('approval_status', status)
  if (query)  dbQuery = dbQuery.ilike('name', `%${query}%`)

  const { data: hospitals, error } = await dbQuery.limit(50)

  // Count per status for tab badges
  const { data: counts } = await (supabase as any)
    .from('hospitals')
    .select('approval_status')
    .is('deleted_at', null)

  const countMap: Record<string, number> = {}
  for (const row of (counts ?? [])) {
    countMap[row.approval_status] = (countMap[row.approval_status] ?? 0) + 1
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hospitals</h1>
          <p className="page-sub">{(hospitals ?? []).length} results</p>
        </div>
        <a href="/admin/hospitals/new" className="add-btn">+ Add hospital</a>
      </div>

      {/* Search */}
      <form method="GET" className="search-bar">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search by hospital name…"
          className="search-input"
        />
        {status && <input type="hidden" name="status" value={status} />}
        <button type="submit" className="search-btn">Search</button>
      </form>

      {/* Status tabs */}
      <div className="status-tabs">
        {STATUS_TABS.map(tab => {
          const count = tab.value ? (countMap[tab.value] ?? 0) : Object.values(countMap).reduce((a, b) => a + b, 0)
          const isActive = status === tab.value
          const href = tab.value
            ? `/admin/hospitals?status=${tab.value}${query ? `&q=${query}` : ''}`
            : `/admin/hospitals${query ? `?q=${query}` : ''}`
          return (
            <Link
              key={tab.value}
              href={href}
              className={`status-tab${isActive ? ' is-active' : ''}`}
            >
              {tab.label}
              <span className="status-tab__count">{count}</span>
            </Link>
          )
        })}
      </div>

      {/* Table */}
      {!hospitals || hospitals.length === 0 ? (
        <div className="empty-state">
          <span>🏥</span>
          <p>No hospitals found</p>
          <span>{status ? `No ${status} hospitals.` : 'No hospitals registered yet.'}</span>
        </div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Location</th>
                <th>Status</th>
                <th>Applied</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h: any) => (
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
                  <td className="table-muted">{h.city}, {h.state}</td>
                  <td>
                    <span className={`status-badge ${STATUS_STYLES[h.approval_status]}`}>
                      {h.approval_status}
                    </span>
                  </td>
                  <td className="table-muted">
                    {new Date(h.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    <Link href={`/admin/hospitals/${h.id}`} className="action-link">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .page-header { margin-bottom: 20px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .add-btn { display: inline-flex; align-items: center; height: 38px; padding: 0 16px; background: var(--myop-teal); color: #fff; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; text-decoration: none; white-space: nowrap; transition: background 0.15s; }
        .add-btn:hover { background: var(--myop-teal-dark); }
        .page-title { font-size: 22px; font-weight: 700; color: var(--myop-slate); letter-spacing: -0.4px; }
        .page-sub { font-size: 13px; color: var(--myop-muted); margin-top: 3px; }

        .search-bar { display: flex; gap: 8px; margin-bottom: 16px; }
        .search-input {
          flex: 1; max-width: 360px;
          height: 38px; padding: 0 12px;
          border: 1.5px solid var(--myop-border); border-radius: var(--radius-sm);
          font-size: 14px; outline: none;
          transition: border-color 0.15s;
        }
        .search-input:focus { border-color: var(--myop-teal); }
        .search-btn {
          height: 38px; padding: 0 16px;
          background: var(--myop-teal); color: #fff;
          border: none; border-radius: var(--radius-sm);
          font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
        }
        .search-btn:hover { background: var(--myop-teal-dark); }

        .status-tabs {
          display: flex; gap: 2px; margin-bottom: 20px;
          border-bottom: 1px solid var(--myop-border);
          overflow-x: auto;
        }
        .status-tab {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 14px;
          font-size: 13px; font-weight: 500;
          color: var(--myop-muted); text-decoration: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          white-space: nowrap;
          transition: color 0.15s;
        }
        .status-tab:hover { color: var(--myop-slate); }
        .status-tab.is-active { color: var(--myop-teal); border-bottom-color: var(--myop-teal); }
        .status-tab__count {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px;
          background: #f1f5f9; color: var(--myop-muted);
          border-radius: 9px; font-size: 10px; font-weight: 700;
          padding: 0 5px;
        }
        .status-tab.is-active .status-tab__count {
          background: rgba(13,148,136,0.12); color: var(--myop-teal);
        }

        .table-card { background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-md); overflow: hidden; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th {
          padding: 10px 16px; text-align: left;
          font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
          text-transform: uppercase; color: var(--myop-muted);
          background: #f8fafc; border-bottom: 1px solid var(--myop-border);
          white-space: nowrap;
        }
        .data-table td {
          padding: 12px 16px; border-bottom: 1px solid #f1f5f9;
          font-size: 14px; color: var(--myop-slate);
        }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:hover td { background: #fafafa; }
        .table-name { font-weight: 600; }
        .table-sub { font-size: 12px; color: var(--myop-muted); margin-top: 2px; }
        .table-muted { color: var(--myop-muted); font-size: 13px; }

        .module-badge {
          display: inline-flex; padding: 3px 8px;
          border-radius: 4px; font-size: 11px; font-weight: 600;
        }
        .module-badge--hospital   { background: #eff6ff; color: #1d4ed8; }
        .module-badge--diagnostic { background: #f0fdf4; color: #15803d; }
        .module-badge--clinic     { background: #fdf4ff; color: #7e22ce; }

        .status-badge {
          display: inline-flex; padding: 3px 8px;
          border-radius: 4px; font-size: 11px; font-weight: 700;
          text-transform: capitalize;
        }
        .status--pending   { background: #fef3c7; color: #92400e; }
        .status--approved  { background: #dcfce7; color: #166534; }
        .status--rejected  { background: #fee2e2; color: #991b1b; }
        .status--suspended { background: #f1f5f9; color: #475569; }

        .action-link {
          font-size: 13px; font-weight: 600;
          color: var(--myop-teal); text-decoration: none;
          transition: color 0.15s;
        }
        .action-link:hover { color: var(--myop-teal-dark); }

        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          gap: 6px; padding: 48px;
          background: #fff; border: 1.5px dashed var(--myop-border);
          border-radius: var(--radius-md); text-align: center;
          font-size: 13px; color: var(--myop-muted);
        }
        .empty-state span:first-child { font-size: 28px; margin-bottom: 4px; }
        .empty-state p { font-weight: 600; color: var(--myop-slate); font-size: 14px; }
      `}</style>
    </>
  )
}