/**
 * app/(hospital)/layout.tsx
 * MYOP Healthcare Marketplace — Hospital Staff Layout Phase 4
 */

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types/domain'

export const metadata: Metadata = {
  title: { template: '%s — MYOP Staff', default: 'Staff Dashboard' },
}

export default async function HospitalLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single<{ full_name: string; role: UserRole }>()

  if (profile?.role !== 'hospital_staff' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: staffRecord } = await (supabase as any)
    .from('hospital_staff')
    .select('hospital_id, hospitals(name, module)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single()

  const hospitalName = staffRecord?.hospitals?.name ?? 'Your Hospital'
  const hospitalModule = staffRecord?.hospitals?.module ?? 'hospital'

  const initials = profile?.full_name
    ? profile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : 'S'

  // Nav links — services only shown for diagnostic/clinic
  const NAV = [
    { href: '/hospital/dashboard',    label: 'Overview',      icon: '⊞' },
    { href: '/hospital/appointments', label: 'Appointments',  icon: '📋' },
    { href: '/hospital/doctors',      label: 'Doctors',       icon: '👨‍⚕️', hideFor: ['diagnostic'] },
    { href: '/hospital/services',     label: 'Services',      icon: '🧪', showFor: ['diagnostic', 'clinic'] },
  ].filter(link => {
    if (link.hideFor?.includes(hospitalModule)) return false
    if (link.showFor && !link.showFor.includes(hospitalModule)) return false
    return true
  })

  return (
    <div className="staff-shell">
      <aside className="staff-sidebar">
        <div className="staff-sidebar__logo">
          <span className="logo-mark">M</span>
          <div className="staff-sidebar__logo-text">
            <span className="staff-sidebar__app-name">MYOP Health</span>
            <span className="staff-sidebar__hospital-name">{hospitalName}</span>
          </div>
        </div>

        <nav aria-label="Staff navigation" className="staff-sidebar__nav">
          {NAV.map(({ href, label, icon }) => (
            <a key={href} href={href} className="staff-sidebar__link">
              <span aria-hidden="true">{icon}</span>
              {label}
            </a>
          ))}
        </nav>

        <div className="staff-sidebar__footer">
          <div className="staff-sidebar__avatar">{initials}</div>
          <div className="staff-sidebar__user-info">
            <span className="staff-sidebar__user-name">{profile?.full_name ?? 'Staff'}</span>
            <span className="staff-sidebar__user-role">Hospital Staff</span>
          </div>
          <form action={signOut}>
            <button type="submit" className="staff-sidebar__signout" title="Sign out">⎋</button>
          </form>
        </div>
      </aside>

      <header className="staff-topbar">
        <span className="logo-mark">M</span>
        <span className="staff-topbar__name">{hospitalName}</span>
      </header>

      <main className="staff-main">
        {children}
      </main>

      <style>{`
        :root {
          --myop-teal:      #0d9488;
          --myop-teal-dark: #0f766e;
          --myop-slate:     #0f172a;
          --myop-muted:     #64748b;
          --myop-border:    #e2e8f0;
          --myop-error:     #ef4444;
          --sidebar-w:      230px;
          --topbar-h:       52px;
          --radius-sm:      6px;
          --radius-md:      10px;
          --radius-lg:      14px;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans','Segoe UI',system-ui,sans-serif; color: var(--myop-slate); background: #f1f5f9; -webkit-font-smoothing: antialiased; }

        .staff-shell { display: flex; min-height: 100dvh; }

        .staff-sidebar { width: var(--sidebar-w); background: var(--myop-slate); display: flex; flex-direction: column; flex-shrink: 0; position: fixed; top: 0; left: 0; height: 100dvh; z-index: 40; }
        @media (max-width: 768px) { .staff-sidebar { display: none; } }

        .staff-sidebar__logo { display: flex; align-items: center; gap: 10px; padding: 20px 16px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .logo-mark { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; min-width: 30px; background: var(--myop-teal); color: #fff; font-size: 14px; font-weight: 800; border-radius: 6px; }
        .staff-sidebar__logo-text { display: flex; flex-direction: column; overflow: hidden; }
        .staff-sidebar__app-name { font-size: 11px; font-weight: 600; color: #475569; letter-spacing: 0.4px; text-transform: uppercase; }
        .staff-sidebar__hospital-name { font-size: 13px; font-weight: 700; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .staff-sidebar__nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
        .staff-sidebar__link { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: var(--radius-sm); font-size: 13.5px; font-weight: 500; color: #64748b; text-decoration: none; transition: background 0.15s, color 0.15s; }
        .staff-sidebar__link:hover { background: rgba(255,255,255,0.08); color: #f1f5f9; }

        .staff-sidebar__footer { padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 10px; }
        .staff-sidebar__avatar { width: 28px; height: 28px; min-width: 28px; background: rgba(13,148,136,0.2); color: var(--myop-teal); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
        .staff-sidebar__user-info { flex: 1; overflow: hidden; }
        .staff-sidebar__user-name { display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .staff-sidebar__user-role { display: block; font-size: 10px; color: #334155; }
        .staff-sidebar__signout { background: none; border: none; font-size: 16px; color: #334155; cursor: pointer; padding: 4px; transition: color 0.15s; line-height: 1; }
        .staff-sidebar__signout:hover { color: #f1f5f9; }

        .staff-topbar { display: none; position: fixed; top: 0; left: 0; right: 0; height: var(--topbar-h); background: var(--myop-slate); border-bottom: 1px solid rgba(255,255,255,0.06); z-index: 40; align-items: center; gap: 10px; padding: 0 16px; }
        @media (max-width: 768px) { .staff-topbar { display: flex; } }
        .staff-topbar__name { font-size: 14px; font-weight: 600; color: #f1f5f9; }

        .staff-main { flex: 1; margin-left: var(--sidebar-w); padding: 28px 24px 48px; max-width: calc(var(--sidebar-w) + 1100px); }
        @media (max-width: 768px) { .staff-main { margin-left: 0; margin-top: var(--topbar-h); padding: 20px 16px 40px; } }
      `}</style>
    </div>
  )
}