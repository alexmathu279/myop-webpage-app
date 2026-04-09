/**
 * app/(patient)/layout.tsx
 * MYOP Healthcare Marketplace
 *
 * Layout for authenticated patient routes:
 *   /dashboard
 *   /bookings/*
 *   /profile/*
 *   /payments/*
 *
 * Server Component — reads the session server-side to populate
 * the nav with the user's name. If no session, middleware will have
 * already redirected to /auth/login before this renders.
 */

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/actions'

export const metadata: Metadata = {
  title: {
    template: '%s — MYOP Health',
    default:  'My Dashboard',
  },
}

export default async function PatientLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('user_profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single<{ full_name: string; avatar_url: string | null }>()
    : { data: null }

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?'

  return (
    <div className="patient-shell">
      {/* Top navigation */}
      <header className="patient-nav">
        <div className="patient-nav__inner">
          {/* Logo */}
          <a href="/dashboard" className="patient-nav__logo" aria-label="MYOP Health home">
            <span className="nav-logo-mark">M</span>
            <span className="nav-logo-text">MYOP Health</span>
          </a>

          {/* Primary nav links */}
          <nav aria-label="Patient navigation" className="patient-nav__links">
            <a href="/dashboard"      className="patient-nav__link">Home</a>
            <a href="/bookings"       className="patient-nav__link">Bookings</a>
            <a href="/payments"       className="patient-nav__link">Payments</a>
          </nav>

          {/* User menu */}
          <div className="patient-nav__user">
            <a href="/profile" className="patient-nav__avatar" aria-label="Your profile">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="patient-nav__avatar-img"
                />
              ) : (
                <span className="patient-nav__avatar-initials">{initials}</span>
              )}
            </a>

            {/* Sign out — Server Action form */}
            <form action={signOut}>
              <button type="submit" className="patient-nav__signout">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="patient-main">
        {children}
      </main>

      <style>{`
        :root {
          --myop-teal:       #0d9488;
          --myop-teal-dark:  #0f766e;
          --myop-teal-light: #ccfbf1;
          --myop-slate:      #0f172a;
          --myop-muted:      #64748b;
          --myop-border:     #e2e8f0;
          --nav-height:      60px;
          --radius-sm:       6px;
          --radius-md:       10px;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
          color: var(--myop-slate);
          background: #f8fafc;
          -webkit-font-smoothing: antialiased;
        }

        .patient-shell {
          display: flex;
          flex-direction: column;
          min-height: 100dvh;
        }

        /* Nav */
        .patient-nav {
          position: sticky;
          top: 0;
          z-index: 40;
          background: #fff;
          border-bottom: 1px solid var(--myop-border);
          height: var(--nav-height);
        }
        .patient-nav__inner {
          display: flex;
          align-items: center;
          gap: 32px;
          height: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .patient-nav__logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .nav-logo-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: var(--myop-teal);
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          border-radius: 6px;
        }
        .nav-logo-text {
          font-size: 15px;
          font-weight: 700;
          color: var(--myop-slate);
          letter-spacing: -0.3px;
        }
        .patient-nav__links {
          display: flex;
          gap: 4px;
          flex: 1;
        }
        @media (max-width: 640px) {
          .patient-nav__links { display: none; }
        }
        .patient-nav__link {
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 14px;
          font-weight: 500;
          color: var(--myop-muted);
          text-decoration: none;
          transition: color 0.15s, background 0.15s;
        }
        .patient-nav__link:hover {
          color: var(--myop-slate);
          background: #f1f5f9;
        }
        .patient-nav__user {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .patient-nav__avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--myop-teal-light);
          text-decoration: none;
          overflow: hidden;
          transition: opacity 0.15s;
        }
        .patient-nav__avatar:hover { opacity: 0.85; }
        .patient-nav__avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .patient-nav__avatar-initials {
          font-size: 12px;
          font-weight: 700;
          color: var(--myop-teal-dark);
        }
        .patient-nav__signout {
          background: none;
          border: none;
          font-size: 13px;
          color: var(--myop-muted);
          cursor: pointer;
          padding: 0;
          transition: color 0.15s;
        }
        .patient-nav__signout:hover { color: var(--myop-slate); }

        /* Main content */
        .patient-main {
          flex: 1;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 28px 20px 48px;
        }
      `}</style>
    </div>
  )
}