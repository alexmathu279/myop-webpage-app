'use client'

/**
 * app/(admin)/_components/AdminLayoutClient.tsx
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/auth/actions'
import { Menu, X, LogOut } from 'lucide-react'

interface NavLink {
  href:  string
  label: string
  icon:  string
  badge: number
}

interface NavSection {
  label: string
  links: NavLink[]
}

interface Props {
  navSections: NavSection[]
  initials:    string
  fullName:    string
  children:    React.ReactNode
}

export default function AdminLayoutClient({ navSections, initials, fullName, children }: Props) {
  const pathname        = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const SidebarContent = () => (
    <>
      {navSections.map(({ label, links }) => (
        <div key={label} className="admin-nav-section">
          <p className="admin-nav-section__label">{label}</p>
          {links.map(({ href, label: linkLabel, icon, badge }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`admin-sidebar__link ${isActive ? 'is-active' : ''}`}
              >
                <span className="admin-sidebar__link-icon">{icon}</span>
                <span className="admin-sidebar__link-label">{linkLabel}</span>
                {badge > 0 && (
                  <span className="admin-sidebar__badge">{badge}</span>
                )}
              </Link>
            )
          })}
        </div>
      ))}
    </>
  )

  return (
    <div className="admin-shell">

      {/* ── Desktop sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <span className="admin-logo-mark">M</span>
          <div>
            <span className="admin-sidebar__app">MYOP Health</span>
            <span className="admin-sidebar__role">Admin Console</span>
          </div>
        </div>

        <nav aria-label="Admin navigation" className="admin-sidebar__nav">
          <SidebarContent />
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__avatar">{initials}</div>
          <div className="admin-sidebar__user-info">
            <span className="admin-sidebar__user-name">{fullName}</span>
            <span className="admin-sidebar__user-role">Administrator</span>
          </div>
          <form action={signOut}>
            <button type="submit" className="admin-sidebar__signout" title="Sign out">
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </aside>

      {/* ── Mobile topbar ── */}
      <header className="admin-topbar">
        <button className="admin-topbar__hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <span className="admin-logo-mark">M</span>
        <span className="admin-topbar__title">Admin Console</span>
      </header>

      {/* ── Drawer overlay ── */}
      {open && <div className="drawer-overlay" onClick={() => setOpen(false)} />}

      {/* ── Mobile drawer ── */}
      <div className={`admin-drawer ${open ? 'is-open' : ''}`}>
        <div className="admin-drawer__header">
          <div>
            <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              MYOP Health
            </span>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Admin Console
            </span>
          </div>
          <button className="drawer-close" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="admin-drawer__nav">
          {navSections.map(({ label, links }) => (
            <div key={label} className="admin-nav-section">
              <p className="admin-nav-section__label" style={{ color: '#94a3b8' }}>{label}</p>
              {links.map(({ href, label: linkLabel, icon, badge }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`admin-drawer__link ${isActive ? 'is-active' : ''}`}
                  >
                    <span>{icon}</span>
                    <span style={{ flex: 1 }}>{linkLabel}</span>
                    {badge > 0 && <span className="admin-sidebar__badge">{badge}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="admin-drawer__footer">
          <div className="admin-sidebar__avatar">{initials}</div>
          <div className="admin-sidebar__user-info">
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{fullName}</span>
            <span style={{ display: 'block', fontSize: 11, color: '#64748b' }}>Administrator</span>
          </div>
          <form action={signOut}>
            <button type="submit" className="drawer-signout-btn">
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="admin-main">
        <div className="admin-main__inner">
          {children}
        </div>
      </main>

      <style>{`
        :root {
          --myop-teal: #0d9488; --myop-teal-dark: #0f766e;
          --myop-slate: #0f172a; --myop-muted: #64748b;
          --myop-border: #e2e8f0; --myop-warning: #f59e0b;
          --admin-sidebar-w: 240px; --admin-topbar-h: 52px;
          --radius-sm: 6px; --radius-md: 10px;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans','Segoe UI',system-ui,sans-serif; color: var(--myop-slate); background: #f1f5f9; -webkit-font-smoothing: antialiased; }

        .admin-shell { display: flex; min-height: 100dvh; }

        /* Desktop sidebar */
        .admin-sidebar { width: var(--admin-sidebar-w); background: #0a0f1e; display: flex; flex-direction: column; flex-shrink: 0; position: fixed; top: 0; left: 0; height: 100dvh; z-index: 40; border-right: 1px solid rgba(255,255,255,0.04); }
        @media (max-width: 768px) { .admin-sidebar { display: none; } }

        .admin-sidebar__logo { display: flex; align-items: center; gap: 10px; padding: 20px 16px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
        .admin-logo-mark { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; min-width: 30px; background: var(--myop-teal); color: #fff; font-size: 14px; font-weight: 800; border-radius: 6px; }
        .admin-sidebar__app { display: block; font-size: 11px; font-weight: 600; color: #334155; letter-spacing: 0.4px; text-transform: uppercase; }
        .admin-sidebar__role { display: block; font-size: 13px; font-weight: 700; color: #cbd5e1; }

        .admin-sidebar__nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
        .admin-nav-section { display: flex; flex-direction: column; gap: 1px; margin-bottom: 12px; }
        .admin-nav-section__label { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #1e293b; padding: 4px 10px 6px; }
        .admin-sidebar__link { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; color: #475569; text-decoration: none; transition: background 0.15s, color 0.15s; position: relative; }
        .admin-sidebar__link:hover { background: rgba(255,255,255,0.05); color: #cbd5e1; }
        .admin-sidebar__link.is-active { background: rgba(13,148,136,0.15); color: #5eead4; }
        .admin-sidebar__link.is-active::before { content: ''; position: absolute; left: 0; top: 6px; bottom: 6px; width: 3px; background: var(--myop-teal); border-radius: 0 2px 2px 0; }
        .admin-sidebar__link-icon { font-size: 14px; flex-shrink: 0; }
        .admin-sidebar__link-label { flex: 1; }
        .admin-sidebar__badge { display: flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; background: var(--myop-warning); color: #fff; font-size: 10px; font-weight: 700; border-radius: 9px; padding: 0 5px; }

        .admin-sidebar__footer { padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .admin-sidebar__avatar { width: 30px; height: 30px; min-width: 30px; background: rgba(13,148,136,0.2); color: var(--myop-teal); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; }
        .admin-sidebar__user-info { flex: 1; overflow: hidden; }
        .admin-sidebar__user-name { display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .admin-sidebar__user-role { display: block; font-size: 10px; color: #334155; }
        .admin-sidebar__signout { background: none; border: none; color: #475569; cursor: pointer; padding: 4px; display: flex; align-items: center; transition: color 0.15s; }
        .admin-sidebar__signout:hover { color: #e2e8f0; }

        /* Mobile topbar */
        .admin-topbar { display: none; position: fixed; top: 0; left: 0; right: 0; height: var(--admin-topbar-h); background: #0a0f1e; border-bottom: 1px solid rgba(255,255,255,0.06); z-index: 40; }
        @media (max-width: 768px) { .admin-topbar { display: flex; align-items: center; gap: 10px; padding: 0 16px; } }
        .admin-topbar__hamburger { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; display: flex; align-items: center; margin-right: 4px; }
        .admin-topbar__title { font-size: 14px; font-weight: 600; color: #cbd5e1; }

        /* Overlay */
        .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 49; backdrop-filter: blur(2px); animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        /* Mobile drawer */
        .admin-drawer { position: fixed; top: 0; left: 0; height: 100dvh; width: 280px; background: #fff; z-index: 50; transform: translateX(-100%); transition: transform 0.25s ease; display: flex; flex-direction: column; box-shadow: 4px 0 24px rgba(0,0,0,0.15); }
        .admin-drawer.is-open { transform: translateX(0); }
        @media (min-width: 769px) { .admin-drawer { display: none; } }

        .admin-drawer__header { display: flex; align-items: center; justify-content: space-between; padding: 20px 16px; border-bottom: 1px solid var(--myop-border); }
        .drawer-close { background: none; border: none; color: var(--myop-muted); cursor: pointer; padding: 4px; display: flex; align-items: center; }

        .admin-drawer__nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
        .admin-drawer__link { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: var(--radius-sm); font-size: 15px; font-weight: 500; color: var(--myop-muted); text-decoration: none; transition: background 0.15s, color 0.15s; }
        .admin-drawer__link:hover { background: #f8fafc; color: var(--myop-slate); }
        .admin-drawer__link.is-active { background: #f0fdfa; color: var(--myop-teal); font-weight: 600; }

        .admin-drawer__footer { padding: 16px; border-top: 1px solid var(--myop-border); display: flex; align-items: center; gap: 12px; }
        .drawer-signout-btn { display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; background: #fee2e2; color: #991b1b; border: none; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
        .drawer-signout-btn:hover { background: #fecaca; }

        /* Main */
        .admin-main { flex: 1; margin-left: var(--admin-sidebar-w); min-height: 100dvh; }
        @media (max-width: 768px) { .admin-main { margin-left: 0; margin-top: var(--admin-topbar-h); } }
        .admin-main__inner { max-width: 1200px; padding: 32px 28px 60px; }
        @media (max-width: 640px) { .admin-main__inner { padding: 20px 16px 40px; } }
      `}</style>
    </div>
  )
}