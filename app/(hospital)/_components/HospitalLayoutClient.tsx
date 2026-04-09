'use client'

/**
 * app/(hospital)/_components/HospitalLayoutClient.tsx
 *
 * Client component for staff layout:
 *   - Desktop: fixed sidebar
 *   - Mobile: hamburger → slide-in drawer + sign out
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'
import { Menu, X, LogOut } from 'lucide-react'

interface NavItem {
  href:  string
  label: string
  icon:  string
}

interface Props {
  hospitalName: string
  initials:     string
  fullName:     string
  nav:          NavItem[]
  children:     React.ReactNode
}

export default function HospitalLayoutClient({
  hospitalName, initials, fullName, nav, children,
}: Props) {
  const pathname          = usePathname()
  const [open, setOpen]   = useState(false)

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <div className="staff-shell">

      {/* ── Desktop sidebar ── */}
      <aside className="staff-sidebar">
        <div className="staff-sidebar__logo">
          <span className="logo-mark">M</span>
          <div className="staff-sidebar__logo-text">
            <span className="staff-sidebar__app-name">MYOP Health</span>
            <span className="staff-sidebar__hospital-name">{hospitalName}</span>
          </div>
        </div>

        <nav aria-label="Staff navigation" className="staff-sidebar__nav">
          {nav.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`staff-sidebar__link ${pathname === href || pathname.startsWith(href + '/') ? 'is-active' : ''}`}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="staff-sidebar__footer">
          <div className="staff-sidebar__avatar">{initials}</div>
          <div className="staff-sidebar__user-info">
            <span className="staff-sidebar__user-name">{fullName}</span>
            <span className="staff-sidebar__user-role">Hospital Staff</span>
          </div>
          <form action={signOut}>
            <button type="submit" className="staff-sidebar__signout" title="Sign out">
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="staff-topbar">
        <button
          className="staff-topbar__hamburger"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span className="logo-mark">M</span>
        <span className="staff-topbar__name">{hospitalName}</span>
      </header>

      {/* ── Mobile drawer overlay ── */}
      {open && (
        <div className="drawer-overlay" onClick={() => setOpen(false)} />
      )}

      {/* ── Mobile drawer ── */}
      <div className={`staff-drawer ${open ? 'is-open' : ''}`}>
        <div className="staff-drawer__header">
          <div className="staff-sidebar__logo-text">
            <span className="staff-sidebar__app-name" style={{ color: '#475569' }}>MYOP Health</span>
            <span className="staff-sidebar__hospital-name">{hospitalName}</span>
          </div>
          <button className="drawer-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="staff-drawer__nav">
          {nav.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`staff-drawer__link ${pathname === href || pathname.startsWith(href + '/') ? 'is-active' : ''}`}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>

        <div className="staff-drawer__footer">
          <div className="staff-sidebar__avatar">{initials}</div>
          <div className="staff-sidebar__user-info">
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              {fullName}
            </span>
            <span style={{ display: 'block', fontSize: 11, color: '#64748b' }}>
              Hospital Staff
            </span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="drawer-signout-btn"
              title="Sign out"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* ── Main content ── */}
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
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans','Segoe UI',system-ui,sans-serif; color: var(--myop-slate); background: #f1f5f9; -webkit-font-smoothing: antialiased; }

        .staff-shell { display: flex; min-height: 100dvh; }

        /* Desktop sidebar */
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
        .staff-sidebar__link.is-active { background: rgba(13,148,136,0.15); color: #5eead4; }

        .staff-sidebar__footer { padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 10px; }
        .staff-sidebar__avatar { width: 28px; height: 28px; min-width: 28px; background: rgba(13,148,136,0.2); color: var(--myop-teal); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
        .staff-sidebar__user-info { flex: 1; overflow: hidden; }
        .staff-sidebar__user-name { display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .staff-sidebar__user-role { display: block; font-size: 10px; color: #334155; }
        .staff-sidebar__signout { background: none; border: none; color: #475569; cursor: pointer; padding: 4px; display: flex; align-items: center; transition: color 0.15s; }
        .staff-sidebar__signout:hover { color: #f1f5f9; }

        /* Mobile topbar */
        .staff-topbar { display: none; position: fixed; top: 0; left: 0; right: 0; height: var(--topbar-h); background: var(--myop-slate); border-bottom: 1px solid rgba(255,255,255,0.06); z-index: 40; align-items: center; gap: 10px; padding: 0 16px; }
        @media (max-width: 768px) { .staff-topbar { display: flex; } }
        .staff-topbar__hamburger { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; display: flex; align-items: center; margin-right: 4px; }
        .staff-topbar__name { font-size: 14px; font-weight: 600; color: #f1f5f9; }

        /* Drawer overlay */
        .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 49; backdrop-filter: blur(2px); animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        /* Mobile drawer */
        .staff-drawer { position: fixed; top: 0; left: 0; height: 100dvh; width: 280px; background: #fff; z-index: 50; transform: translateX(-100%); transition: transform 0.25s ease; display: flex; flex-direction: column; box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
        .staff-drawer.is-open { transform: translateX(0); }
        @media (min-width: 769px) { .staff-drawer { display: none; } }

        .staff-drawer__header { display: flex; align-items: center; justify-content: space-between; padding: 20px 16px; border-bottom: 1px solid var(--myop-border); }
        .drawer-close { background: none; border: none; color: var(--myop-muted); cursor: pointer; padding: 4px; display: flex; align-items: center; }

        .staff-drawer__nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
        .staff-drawer__link { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: var(--radius-sm); font-size: 15px; font-weight: 500; color: var(--myop-muted); text-decoration: none; transition: background 0.15s, color 0.15s; }
        .staff-drawer__link:hover { background: #f8fafc; color: var(--myop-slate); }
        .staff-drawer__link.is-active { background: #f0fdfa; color: var(--myop-teal); font-weight: 600; }

        .staff-drawer__footer { padding: 16px; border-top: 1px solid var(--myop-border); display: flex; align-items: center; gap: 12px; }
        .drawer-signout-btn { display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; background: #fee2e2; color: #991b1b; border: none; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
        .drawer-signout-btn:hover { background: #fecaca; }

        /* Main */
        .staff-main { flex: 1; margin-left: var(--sidebar-w); padding: 28px 24px 48px; }
        @media (max-width: 768px) { .staff-main { margin-left: 0; margin-top: var(--topbar-h); padding: 20px 16px 40px; } }
      `}</style>
    </div>
  )
}