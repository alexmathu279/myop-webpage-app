/**
 * app/(admin)/layout.tsx
 * MYOP Healthcare Marketplace — Admin Layout
 * Phase 3: Updated with active link state and trimmed nav to Phase 3 scope
 */

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types/domain'

export const metadata: Metadata = {
  title: { template: '%s — MYOP Admin', default: 'Admin' },
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single<{ full_name: string; role: UserRole }>()

  // Enforce admin-only access at layout level
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Get current pathname for active link highlighting
  const headersList = await headers()
  const pathname = headersList.get('x-invoke-path') ?? ''

  // Pending hospitals count for badge
  const { count: pendingCount } = await (supabase as any)
    .from('hospitals')
    .select('id', { count: 'exact', head: true })
    .eq('approval_status', 'pending')
    .is('deleted_at', null)

  const NAV_SECTIONS = [
    {
      label: 'Operations',
      links: [
        { href: '/admin/dashboard',        label: 'Dashboard',       icon: '⊞' },
        { href: '/admin/hospitals',        label: 'Hospitals',       icon: '🏥', badge: pendingCount || 0 },
        { href: '/admin/hospitals/pending',label: 'Pending Approval',icon: '⏳', badge: pendingCount || 0 },
      ],
    },
    {
      label: 'Platform',
      links: [
        { href: '/admin/staff',            label: 'Staff & Invites', icon: '👥' },
      ],
    },
  ]

  const initials = profile?.full_name
    ? profile.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : 'A'

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        {/* Logo */}
        <div className="admin-sidebar__logo">
          <span className="admin-logo-mark">M</span>
          <div>
            <span className="admin-sidebar__app">MYOP Health</span>
            <span className="admin-sidebar__role">Admin Console</span>
          </div>
        </div>

        {/* Nav */}
        <nav aria-label="Admin navigation" className="admin-sidebar__nav">
          {NAV_SECTIONS.map(({ label, links }) => (
            <div key={label} className="admin-nav-section">
              <p className="admin-nav-section__label">{label}</p>
              {links.map(({ href, label: linkLabel, icon, badge }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <a
                    key={href}
                    href={href}
                    className={`admin-sidebar__link${isActive ? ' is-active' : ''}`}
                  >
                    <span aria-hidden="true" className="admin-sidebar__link-icon">{icon}</span>
                    <span className="admin-sidebar__link-label">{linkLabel}</span>
                    {badge > 0 && (
                      <span className="admin-sidebar__badge">{badge}</span>
                    )}
                  </a>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__avatar">{initials}</div>
          <div className="admin-sidebar__user-info">
            <span className="admin-sidebar__user-name">{profile?.full_name ?? 'Admin'}</span>
            <span className="admin-sidebar__user-role">Administrator</span>
          </div>
          <form action={signOut}>
            <button type="submit" className="admin-sidebar__signout" title="Sign out">
              ⎋
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="admin-topbar">
        <div className="admin-topbar__inner">
          <span className="admin-logo-mark">M</span>
          <span className="admin-topbar__title">Admin Console</span>
        </div>
      </header>

      {/* Main content */}
      <main className="admin-main">
        <div className="admin-main__inner">
          {children}
        </div>
      </main>

      <style>{`
        :root {
          --myop-teal:        #0d9488;
          --myop-teal-dark:   #0f766e;
          --myop-teal-light:  #ccfbf1;
          --myop-slate:       #0f172a;
          --myop-muted:       #64748b;
          --myop-border:      #e2e8f0;
          --myop-error:       #ef4444;
          --myop-warning:     #f59e0b;
          --myop-success:     #22c55e;
          --admin-sidebar-w:  240px;
          --admin-topbar-h:   52px;
          --radius-sm:        6px;
          --radius-md:        10px;
          --radius-lg:        14px;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
          color: var(--myop-slate);
          background: #f1f5f9;
          -webkit-font-smoothing: antialiased;
        }

        .admin-shell {
          display: flex;
          min-height: 100dvh;
        }

        /* ---- Sidebar ---- */
        .admin-sidebar {
          width: var(--admin-sidebar-w);
          background: #0a0f1e;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          position: fixed;
          top: 0; left: 0;
          height: 100dvh;
          z-index: 40;
          border-right: 1px solid rgba(255,255,255,0.04);
        }
        @media (max-width: 768px) { .admin-sidebar { display: none; } }

        .admin-sidebar__logo {
          display: flex; align-items: center; gap: 10px;
          padding: 20px 16px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .admin-logo-mark {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; min-width: 30px;
          background: var(--myop-teal); color: #fff;
          font-size: 14px; font-weight: 800; border-radius: 6px;
          letter-spacing: -0.5px;
        }
        .admin-sidebar__app {
          display: block; font-size: 11px; font-weight: 600;
          color: #334155; letter-spacing: 0.4px; text-transform: uppercase;
        }
        .admin-sidebar__role {
          display: block; font-size: 13px; font-weight: 700; color: #cbd5e1;
        }

        .admin-sidebar__nav {
          flex: 1; padding: 12px 8px;
          display: flex; flex-direction: column; gap: 2px;
          overflow-y: auto;
        }
        .admin-nav-section {
          display: flex; flex-direction: column; gap: 1px;
          margin-bottom: 12px;
        }
        .admin-nav-section__label {
          font-size: 10px; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; color: #1e293b;
          padding: 4px 10px 6px;
        }
        .admin-sidebar__link {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px; border-radius: var(--radius-sm);
          font-size: 13px; font-weight: 500; color: #475569;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          position: relative;
        }
        .admin-sidebar__link:hover {
          background: rgba(255,255,255,0.05); color: #cbd5e1;
        }
        .admin-sidebar__link.is-active {
          background: rgba(13,148,136,0.15);
          color: #5eead4;
        }
        .admin-sidebar__link.is-active::before {
          content: '';
          position: absolute;
          left: 0; top: 6px; bottom: 6px;
          width: 3px;
          background: var(--myop-teal);
          border-radius: 0 2px 2px 0;
        }
        .admin-sidebar__link-icon { font-size: 14px; flex-shrink: 0; }
        .admin-sidebar__link-label { flex: 1; }
        .admin-sidebar__badge {
          display: flex; align-items: center; justify-content: center;
          min-width: 18px; height: 18px;
          background: var(--myop-warning);
          color: #fff;
          font-size: 10px; font-weight: 700;
          border-radius: 9px;
          padding: 0 5px;
        }

        .admin-sidebar__footer {
          padding: 12px 14px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; gap: 10px;
          flex-shrink: 0;
        }
        .admin-sidebar__avatar {
          width: 30px; height: 30px; min-width: 30px;
          background: rgba(13,148,136,0.2);
          color: var(--myop-teal);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700;
        }
        .admin-sidebar__user-info {
          flex: 1; overflow: hidden;
        }
        .admin-sidebar__user-name {
          display: block;
          font-size: 12px; font-weight: 600; color: #cbd5e1;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .admin-sidebar__user-role {
          display: block;
          font-size: 10px; color: #334155;
        }
        .admin-sidebar__signout {
          background: none; border: none;
          font-size: 16px; color: #334155;
          cursor: pointer; flex-shrink: 0;
          padding: 4px;
          transition: color 0.15s;
          line-height: 1;
        }
        .admin-sidebar__signout:hover { color: #e2e8f0; }

        /* ---- Mobile topbar ---- */
        .admin-topbar {
          display: none;
          position: fixed; top: 0; left: 0; right: 0;
          height: var(--admin-topbar-h);
          background: #0a0f1e;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          z-index: 40;
        }
        @media (max-width: 768px) { .admin-topbar { display: flex; } }
        .admin-topbar__inner {
          display: flex; align-items: center; gap: 10px;
          padding: 0 16px; height: 100%;
        }
        .admin-topbar__title {
          font-size: 14px; font-weight: 600; color: #cbd5e1;
        }

        /* ---- Main ---- */
        .admin-main {
          flex: 1;
          margin-left: var(--admin-sidebar-w);
          min-height: 100dvh;
        }
        @media (max-width: 768px) {
          .admin-main {
            margin-left: 0;
            margin-top: var(--admin-topbar-h);
          }
        }
        .admin-main__inner {
          max-width: 1200px;
          padding: 32px 28px 60px;
        }
        @media (max-width: 640px) {
          .admin-main__inner { padding: 20px 16px 40px; }
        }
      `}</style>
    </div>
  )
}