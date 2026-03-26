/**
 * app/(hospital)/hospital/services/page.tsx
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getStaffHospital, deleteService } from '@/lib/hospital/actions'
import DeleteServiceButton from './delete-button'

export const metadata: Metadata = { title: 'Services' }

export default async function ServicesPage() {
  const staff = await getStaffHospital()
  if (!staff) redirect('/auth/login')

  const supabase = await createClient()
  const { data: services } = await (supabase as any)
    .from('services')
    .select('id, name, category, price, duration_mins, is_home_collection, is_active, report_tat_hrs')
    .eq('hospital_id', staff.hospitalId)
    .is('deleted_at', null)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  // Group by category
  const grouped: Record<string, any[]> = {}
  for (const s of (services ?? [])) {
    const cat = s.category || 'General'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(s)
  }

  const moduleLabel = staff.module === 'diagnostic' ? 'test / service' : 'service'

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-sub">{(services ?? []).length} services listed</p>
        </div>
        <Link href="/hospital/services/new" className="primary-btn">+ Add {moduleLabel}</Link>
      </div>

      {!services || services.length === 0 ? (
        <div className="empty-state">
          <span>🧪</span>
          <p>No services yet</p>
          <span>Add your services and set pricing so patients can book.</span>
          <Link href="/hospital/services/new" className="primary-btn" style={{ marginTop: 12 }}>
            + Add first {moduleLabel}
          </Link>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <section key={category} className="category-section">
            <h2 className="category-title">{category}</h2>
            <div className="service-list">
              {items.map((s: any) => (
                <div key={s.id} className={`service-row ${!s.is_active ? 'is-inactive' : ''}`}>
                  <div className="service-row__body">
                    <div className="service-row__name">{s.name}</div>
                    <div className="service-row__meta">
                      {s.duration_mins && <span>{s.duration_mins} min</span>}
                      {s.report_tat_hrs && <span>Report in {s.report_tat_hrs}h</span>}
                      {s.is_home_collection && <span className="home-tag">🏠 Home collection</span>}
                      {!s.is_active && <span className="inactive-tag">Inactive</span>}
                    </div>
                  </div>
                  <div className="service-row__price">₹{s.price}</div>
                  <div className="service-row__actions">
                    <Link href={`/hospital/services/${s.id}`} className="icon-btn">Edit</Link>
                    <DeleteServiceButton serviceId={s.id} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <style>{`
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .page-title { font-size: 22px; font-weight: 700; color: var(--myop-slate); letter-spacing: -0.4px; }
        .page-sub { font-size: 13px; color: var(--myop-muted); margin-top: 3px; }
        .primary-btn { display: inline-flex; align-items: center; height: 38px; padding: 0 16px; background: var(--myop-teal); color: #fff; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; text-decoration: none; transition: background 0.15s; }
        .primary-btn:hover { background: var(--myop-teal-dark); }

        .category-section { margin-bottom: 24px; }
        .category-title { font-size: 13px; font-weight: 700; color: var(--myop-muted); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid var(--myop-border); }
        .service-list { display: flex; flex-direction: column; gap: 6px; }
        .service-row { display: flex; align-items: center; gap: 16px; background: #fff; border: 1px solid var(--myop-border); border-radius: var(--radius-md); padding: 12px 16px; transition: border-color 0.15s; }
        .service-row:hover { border-color: var(--myop-teal); }
        .service-row.is-inactive { opacity: 0.5; }
        .service-row__body { flex: 1; min-width: 0; }
        .service-row__name { font-size: 14px; font-weight: 600; color: var(--myop-slate); }
        .service-row__meta { display: flex; gap: 8px; margin-top: 3px; font-size: 12px; color: var(--myop-muted); flex-wrap: wrap; align-items: center; }
        .home-tag { color: #065f46; background: #ecfdf5; padding: 1px 6px; border-radius: 3px; font-weight: 500; }
        .inactive-tag { color: #991b1b; background: #fee2e2; padding: 1px 6px; border-radius: 3px; font-weight: 700; font-size: 10px; }
        .service-row__price { font-size: 16px; font-weight: 800; color: var(--myop-slate); flex-shrink: 0; }
        .service-row__actions { display: flex; gap: 6px; flex-shrink: 0; }
        .icon-btn { background: none; border: 1px solid var(--myop-border); border-radius: var(--radius-sm); padding: 4px 10px; font-size: 12px; color: var(--myop-muted); cursor: pointer; transition: all 0.15s; text-decoration: none; display: inline-flex; align-items: center; }
        .icon-btn:hover { background: #f1f5f9; color: var(--myop-slate); }
        .icon-btn--danger { color: var(--myop-error); }
        .icon-btn--danger:hover { background: #fee2e2; border-color: #fecaca; }

        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 60px; background: #fff; border: 1.5px dashed var(--myop-border); border-radius: var(--radius-md); text-align: center; }
        .empty-state span:first-child { font-size: 36px; }
        .empty-state p { font-size: 16px; font-weight: 700; color: var(--myop-slate); }
        .empty-state span { font-size: 13px; color: var(--myop-muted); }
      `}</style>
    </>
  )
}