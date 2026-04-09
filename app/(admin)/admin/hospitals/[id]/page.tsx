/**
 * app/(admin)/admin/hospitals/[id]/page.tsx
 * Server Component — fetches hospital data server-side.
 * Action forms use simple POST without useActionState.
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  approveHospital,
  rejectHospital,
  suspendHospital,
  reactivateHospital,
} from '@/lib/admin/hospitals'


import type { UserRole } from '@/types/domain'
import RejectForm from './reject-form'
import SuspendForm from './suspend-form'

export const metadata: Metadata = { title: 'Hospital Review' }

interface Props {
  params: Promise<{ id: string }>
}

const MODULE_LABELS: Record<string, string> = {
  hospital:   'Hospital',
  diagnostic: 'Diagnostic Centre',
  clinic:     'Clinic',
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#fef3c7', color: '#92400e', label: 'Pending Review' },
  approved:  { bg: '#dcfce7', color: '#166534', label: 'Approved' },
  rejected:  { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
  suspended: { bg: '#f1f5f9', color: '#475569', label: 'Suspended' },
}

export default async function HospitalDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: UserRole }>()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch hospital
  const { data: hospital } = await (supabase as any)
    .from('hospitals')
    .select(`
      id, name, module, approval_status,
      email, phone, website,
      address_line1, address_line2, city, state, pincode,
      description, rejection_reason,
      suspended_at, created_at, approved_at
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!hospital) redirect('/admin/hospitals')

  const statusStyle = STATUS_STYLES[hospital.approval_status] ?? STATUS_STYLES.pending

  return (
    <>
      <div className="page-header">
        <a href="/admin/hospitals" className="back-link">← All hospitals</a>
      </div>

      {/* Header card */}
      <div className="detail-header">
        <div className="detail-header__top">
          <div>
            <h1 className="detail-name">{hospital.name}</h1>
            <div className="detail-meta">
              <span className={`module-badge module-badge--${hospital.module}`}>
                {MODULE_LABELS[hospital.module]}
              </span>
              <span
                className="status-badge"
                style={{ background: statusStyle.bg, color: statusStyle.color }}
              >
                {statusStyle.label}
              </span>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="action-buttons">
            {hospital.approval_status === 'pending' && (
              <form action={approveHospital}>
                <input type="hidden" name="hospital_id" value={hospital.id} />
                <button type="submit" className="btn btn--approve">✓ Approve</button>
               </form>
            )}
            {(hospital.approval_status === 'rejected') && (
              <form action={approveHospital}>
                <input type="hidden" name="hospital_id" value={hospital.id} />
                <button type="submit" className="btn btn--approve">↩ Approve anyway</button>
              </form>
            )}
            {hospital.approval_status === 'suspended' && (
              <form action={reactivateHospital}>
                <input type="hidden" name="hospital_id" value={hospital.id} />
                <button type="submit" className="btn btn--approve">↩ Reactivate</button>
              </form>
            )}
          </div>
        </div>

        <a href={`/admin/hospitals/${hospital.id}/edit`} className="btn btn--edit">
        ✎ Edit details
        </a>    

        {/* Reject form — client component for textarea interaction */}
        {hospital.approval_status === 'pending' && (
          <RejectForm hospitalId={hospital.id} action={rejectHospital} />
        )}

        {/* Suspend form */}
        {hospital.approval_status === 'approved' && (
          <SuspendForm hospitalId={hospital.id} action={suspendHospital} />
        )}

        {/* Rejection/suspension reason display */}
        {hospital.rejection_reason && (
          <div className="reason-display">
            <strong>
              {hospital.approval_status === 'suspended' ? 'Suspension reason:' : 'Rejection reason:'}
            </strong>
            <p>{hospital.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* Detail grid */}
      <div className="detail-grid">
        <section className="detail-card">
          <h3 className="detail-card__title">Contact</h3>
          <dl className="detail-list">
            <div className="detail-item">
              <dt>Email</dt>
              <dd><a href={`mailto:${hospital.email}`}>{hospital.email}</a></dd>
            </div>
            <div className="detail-item">
              <dt>Phone</dt>
              <dd>{hospital.phone}</dd>
            </div>
            {hospital.website && (
              <div className="detail-item">
                <dt>Website</dt>
                <dd><a href={hospital.website} target="_blank" rel="noopener noreferrer">{hospital.website}</a></dd>
              </div>
            )}
          </dl>
        </section>

        <section className="detail-card">
          <h3 className="detail-card__title">Address</h3>
          <dl className="detail-list">
            <div className="detail-item">
              <dt>Street</dt>
              <dd>{hospital.address_line1}{hospital.address_line2 ? `, ${hospital.address_line2}` : ''}</dd>
            </div>
            <div className="detail-item"><dt>City</dt><dd>{hospital.city}</dd></div>
            <div className="detail-item"><dt>State</dt><dd>{hospital.state}</dd></div>
            <div className="detail-item"><dt>Pincode</dt><dd>{hospital.pincode}</dd></div>
          </dl>
        </section>

        <section className="detail-card">
          <h3 className="detail-card__title">Timeline</h3>
          <dl className="detail-list">
            <div className="detail-item">
              <dt>Applied on</dt>
              <dd>{new Date(hospital.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</dd>
            </div>
            {hospital.approved_at && (
              <div className="detail-item">
                <dt>Approved on</dt>
                <dd>{new Date(hospital.approved_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</dd>
              </div>
            )}
            {hospital.suspended_at && (
              <div className="detail-item">
                <dt>Suspended on</dt>
                <dd>{new Date(hospital.suspended_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</dd>
              </div>
            )}
          </dl>
        </section>

        {hospital.description && (
          <section className="detail-card detail-card--full">
            <h3 className="detail-card__title">Description</h3>
            <p className="detail-desc">{hospital.description}</p>
          </section>
        )}
      </div>

      <style>{`
        .page-header { margin-bottom: 20px; }
        .back-link { font-size: 13px; font-weight: 500; color: var(--myop-muted); text-decoration: none; transition: color 0.15s; }
        .back-link:hover { color: var(--myop-slate); }

        .detail-header { background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 20px; }
        .detail-header__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 4px; }
        .detail-name { font-size: 22px; font-weight: 800; color: var(--myop-slate); letter-spacing: -0.4px; margin-bottom: 8px; }
        .detail-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        .action-buttons { display: flex; gap: 8px; flex-wrap: wrap; flex-shrink: 0; }
        .btn { display: inline-flex; align-items: center; height: 36px; padding: 0 16px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
        .btn--approve { background: var(--myop-teal); color: #fff; }
        .btn--approve:hover { background: var(--myop-teal-dark); }

        .reason-display { margin-top: 16px; padding: 12px 14px; background: #fef2f2; border-radius: var(--radius-sm); border: 1px solid #fecaca; }
        .reason-display strong { font-size: 12px; color: #991b1b; text-transform: uppercase; letter-spacing: 0.4px; }
        .reason-display p { font-size: 13px; color: #7f1d1d; margin-top: 4px; line-height: 1.5; }

        .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
        .detail-card { background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-md); padding: 20px; }
        .detail-card--full { grid-column: 1 / -1; }
        .detail-card__title { font-size: 11px; font-weight: 700; color: var(--myop-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; }
        .detail-list { display: flex; flex-direction: column; gap: 10px; }
        .detail-item { display: flex; flex-direction: column; gap: 2px; }
        .detail-item dt { font-size: 11px; font-weight: 600; color: var(--myop-muted); text-transform: uppercase; letter-spacing: 0.3px; }
        .detail-item dd { font-size: 14px; color: var(--myop-slate); }
        .detail-item dd a { color: var(--myop-teal); text-decoration: none; }
        .detail-item dd a:hover { text-decoration: underline; }
        .detail-desc { font-size: 14px; color: var(--myop-muted); line-height: 1.6; }

        .module-badge { display: inline-flex; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .module-badge--hospital   { background: #eff6ff; color: #1d4ed8; }
        .module-badge--diagnostic { background: #f0fdf4; color: #15803d; }
        .module-badge--clinic     { background: #fdf4ff; color: #7e22ce; }
        .status-badge { display: inline-flex; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; }
      `}</style>
    </>
  )
}