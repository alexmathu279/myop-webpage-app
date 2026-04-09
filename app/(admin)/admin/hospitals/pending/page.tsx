/**
 * app/(admin)/admin/hospitals/pending/page.tsx
 * MYOP Healthcare Marketplace
 *
 * Pending hospital applications — focused review queue.
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Pending Approvals' }

const MODULE_LABELS: Record<string, string> = {
  hospital:   'Hospital',
  diagnostic: 'Diagnostic Centre',
  clinic:     'Clinic',
}

export default async function PendingHospitalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: hospitals } = await (supabase as any)
    .from('hospitals')
    .select('id, name, module, city, state, email, phone, description, created_at')
    .eq('approval_status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })  // oldest first — FIFO review

  const count = hospitals?.length ?? 0

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pending Approvals</h1>
          <p className="page-sub">
            {count === 0
              ? 'All caught up — no pending applications.'
              : `${count} application${count !== 1 ? 's' : ''} waiting for review`}
          </p>
        </div>
        <Link href="/admin/hospitals" className="back-link">← All hospitals</Link>
      </div>

      {count === 0 ? (
        <div className="empty-state">
          <span>🎉</span>
          <p>No pending applications</p>
          <span>New hospital registrations will appear here.</span>
        </div>
      ) : (
        <div className="pending-list">
          {hospitals.map((h: any, index: number) => (
            <div key={h.id} className="pending-card">
              <div className="pending-card__number">#{index + 1}</div>
              <div className="pending-card__body">
                <div className="pending-card__header">
                  <div>
                    <h3 className="pending-card__name">{h.name}</h3>
                    <div className="pending-card__meta">
                      <span className={`module-badge module-badge--${h.module}`}>
                        {MODULE_LABELS[h.module]}
                      </span>
                      <span className="pending-card__location">📍 {h.city}, {h.state}</span>
                      <span className="pending-card__date">
                        Applied {new Date(h.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <Link href={`/admin/hospitals/${h.id}`} className="review-btn">
                    Review application →
                  </Link>
                </div>
                <div className="pending-card__contact">
                  <span>📧 {h.email}</span>
                  <span>📞 {h.phone}</span>
                </div>
                {h.description && (
                  <p className="pending-card__desc">{h.description.slice(0, 160)}{h.description.length > 160 ? '…' : ''}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .page-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px;
          margin-bottom: 24px; flex-wrap: wrap;
        }
        .page-title { font-size: 22px; font-weight: 700; color: var(--myop-slate); letter-spacing: -0.4px; }
        .page-sub { font-size: 13px; color: var(--myop-muted); margin-top: 3px; }
        .back-link {
          font-size: 13px; font-weight: 500;
          color: var(--myop-muted); text-decoration: none;
          transition: color 0.15s; white-space: nowrap;
        }
        .back-link:hover { color: var(--myop-slate); }

        .pending-list { display: flex; flex-direction: column; gap: 12px; }
        .pending-card {
          display: flex; gap: 16px;
          background: #fff; border: 1px solid var(--myop-border);
          border-radius: var(--radius-md); padding: 20px;
          transition: border-color 0.15s;
        }
        .pending-card:hover { border-color: var(--myop-teal); }
        .pending-card__number {
          font-size: 12px; font-weight: 700; color: var(--myop-muted);
          width: 24px; flex-shrink: 0; padding-top: 2px;
        }
        .pending-card__body { flex: 1; min-width: 0; }
        .pending-card__header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 12px;
          margin-bottom: 10px; flex-wrap: wrap;
        }
        .pending-card__name {
          font-size: 16px; font-weight: 700;
          color: var(--myop-slate); margin-bottom: 6px;
        }
        .pending-card__meta {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        .pending-card__location, .pending-card__date {
          font-size: 12px; color: var(--myop-muted);
        }
        .pending-card__contact {
          display: flex; gap: 16px; flex-wrap: wrap;
          font-size: 13px; color: var(--myop-muted);
          margin-bottom: 8px;
        }
        .pending-card__desc {
          font-size: 13px; color: var(--myop-muted);
          line-height: 1.5; margin-top: 8px;
        }

        .module-badge {
          display: inline-flex; padding: 3px 8px;
          border-radius: 4px; font-size: 11px; font-weight: 600;
        }
        .module-badge--hospital   { background: #eff6ff; color: #1d4ed8; }
        .module-badge--diagnostic { background: #f0fdf4; color: #15803d; }
        .module-badge--clinic     { background: #fdf4ff; color: #7e22ce; }

        .review-btn {
          display: inline-flex; align-items: center;
          padding: 8px 16px; border-radius: var(--radius-sm);
          background: var(--myop-teal); color: #fff;
          font-size: 13px; font-weight: 600;
          text-decoration: none; white-space: nowrap;
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .review-btn:hover { background: var(--myop-teal-dark); }

        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          gap: 8px; padding: 60px;
          background: #fff; border: 1.5px dashed var(--myop-border);
          border-radius: var(--radius-md); text-align: center;
        }
        .empty-state span:first-child { font-size: 36px; }
        .empty-state p { font-size: 16px; font-weight: 700; color: var(--myop-slate); }
        .empty-state span { font-size: 13px; color: var(--myop-muted); }
      `}</style>
    </>
  )
}