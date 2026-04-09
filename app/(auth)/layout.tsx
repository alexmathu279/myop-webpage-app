/**
 * app/(auth)/layout.tsx
 * MYOP Healthcare Marketplace
 *
 * Shared layout for all auth pages:
 *   /auth/login
 *   /auth/signup
 *   /auth/invite/accept
 *   /auth/onboarding
 *   /auth/error
 *
 * Two-column on desktop: left brand panel, right form.
 * Single column on mobile: form only.
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s — MYOP Health',
    default:  'MYOP Health',
  },
  description: 'Your complete healthcare marketplace',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="auth-shell">
      {/* Left: brand panel — hidden on mobile */}
      <aside className="auth-brand" aria-hidden="true">
        <div className="auth-brand__inner">
          <div className="auth-brand__logo">
            <span className="auth-brand__logo-mark">M</span>
            <span className="auth-brand__logo-text">MYOP Health</span>
          </div>

          <div className="auth-brand__copy">
            <h1 className="auth-brand__headline">
              Healthcare,<br />
              <em>on your terms.</em>
            </h1>
            <p className="auth-brand__sub">
              Book doctor appointments, lab tests, and clinic visits —
              all in one place.
            </p>
          </div>

          <ul className="auth-brand__pills" aria-label="Platform features">
            <li>
              <span className="pill-icon">🏥</span>
              500+ hospitals
            </li>
            <li>
              <span className="pill-icon">🧪</span>
              Lab tests at home
            </li>
            <li>
              <span className="pill-icon">💊</span>
              Specialist clinics
            </li>
          </ul>

          {/* Decorative grid */}
          <div className="auth-brand__grid" aria-hidden="true">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="auth-brand__grid-cell" />
            ))}
          </div>
        </div>
      </aside>

      {/* Right: form area */}
      <main className="auth-form-panel">
        {/* Mobile logo */}
        <div className="auth-mobile-logo" aria-label="MYOP Health">
          <span className="auth-brand__logo-mark">M</span>
          <span className="auth-brand__logo-text">MYOP Health</span>
        </div>

        <div className="auth-form-panel__inner">
          {children}
        </div>
      </main>

      <style>{`
        /* ----------------------------------------------------------------
           CSS Custom Properties
        ---------------------------------------------------------------- */
        :root {
          --myop-teal:       #0d9488;
          --myop-teal-dark:  #0f766e;
          --myop-teal-light: #ccfbf1;
          --myop-slate:      #0f172a;
          --myop-slate-mid:  #1e293b;
          --myop-muted:      #64748b;
          --myop-border:     #e2e8f0;
          --myop-error:      #ef4444;
          --myop-error-bg:   #fef2f2;
          --myop-success:    #22c55e;
          --radius-sm:       6px;
          --radius-md:       10px;
          --radius-lg:       16px;
        }

        /* ----------------------------------------------------------------
           Reset / base
        ---------------------------------------------------------------- */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
          color: var(--myop-slate);
          background: #f8fafc;
          -webkit-font-smoothing: antialiased;
        }

        /* ----------------------------------------------------------------
           Shell
        ---------------------------------------------------------------- */
        .auth-shell {
          display: grid;
          grid-template-columns: 1fr;
          min-height: 100dvh;
        }

        @media (min-width: 1024px) {
          .auth-shell {
            grid-template-columns: 480px 1fr;
          }
        }

        /* ----------------------------------------------------------------
           Brand panel (left)
        ---------------------------------------------------------------- */
        .auth-brand {
          display: none;
          background: var(--myop-slate);
          position: relative;
          overflow: hidden;
        }

        @media (min-width: 1024px) {
          .auth-brand { display: flex; flex-direction: column; }
        }

        .auth-brand__inner {
          display: flex;
          flex-direction: column;
          gap: 48px;
          padding: 48px 40px;
          height: 100%;
          position: relative;
          z-index: 1;
        }

        .auth-brand__logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .auth-brand__logo-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: var(--myop-teal);
          color: #fff;
          font-size: 18px;
          font-weight: 800;
          border-radius: var(--radius-sm);
          letter-spacing: -0.5px;
        }

        .auth-brand__logo-text {
          color: #f1f5f9;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.3px;
        }

        .auth-brand__copy {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 16px;
        }

        .auth-brand__headline {
          color: #f1f5f9;
          font-size: clamp(32px, 3.5vw, 44px);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -1.5px;
        }

        .auth-brand__headline em {
          font-style: normal;
          color: var(--myop-teal);
        }

        .auth-brand__sub {
          color: #94a3b8;
          font-size: 15px;
          line-height: 1.6;
          max-width: 340px;
        }

        .auth-brand__pills {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .auth-brand__pills li {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #cbd5e1;
          font-size: 14px;
          font-weight: 500;
        }

        .pill-icon {
          font-size: 16px;
        }

        /* Decorative dot grid */
        .auth-brand__grid {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 200px;
          height: 200px;
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 6px;
          opacity: 0.12;
          pointer-events: none;
        }

        .auth-brand__grid-cell {
          width: 3px;
          height: 3px;
          background: #fff;
          border-radius: 50%;
        }

        /* ----------------------------------------------------------------
           Form panel (right)
        ---------------------------------------------------------------- */
        .auth-form-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 16px 48px;
          background: #f8fafc;
        }

        @media (min-width: 640px) {
          .auth-form-panel {
            padding: 48px 32px;
          }
        }

        .auth-mobile-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 32px;
          align-self: flex-start;
        }

        @media (min-width: 1024px) {
          .auth-mobile-logo { display: none; }
        }

        .auth-form-panel__inner {
          width: 100%;
          max-width: 440px;
          margin: auto;
        }
      `}</style>
    </div>
  )
}