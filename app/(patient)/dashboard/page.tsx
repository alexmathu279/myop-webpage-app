/**
 * app/(patient)/dashboard/page.tsx
 * Updated — module cards are now links to the booking pages
 */

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function PatientDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, is_onboarded')
    .eq('id', user.id)
    .single<{ full_name: string; is_onboarded: boolean }>()

  if (profile && !profile.is_onboarded) redirect('/auth/onboarding')

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const MODULES = [
    {
      href:     '/hospitals',
      icon:     '🏥',
      title:    'Book a Doctor',
      desc:     'Find specialists at top hospitals near you',
      color:    '#0d9488',
      bg:       'rgba(13,148,136,0.08)',
      border:   'rgba(13,148,136,0.2)',
    },
    {
      href:     '/book/diagnostic',
      icon:     '🧪',
      title:    'Lab Tests',
      desc:     'Book tests at diagnostic centres or at home',
      color:    '#0891b2',
      bg:       'rgba(8,145,178,0.08)',
      border:   'rgba(8,145,178,0.2)',
    },
    {
      href:     '/book/clinic',
      icon:     '💊',
      title:    'Clinic Visit',
      desc:     'Walk-in or appointment at private clinics',
      color:    '#7c3aed',
      bg:       'rgba(124,58,237,0.08)',
      border:   'rgba(124,58,237,0.2)',
    },
  ]

  return (
    <>
      <div className="dash-header">
        <div>
          <h1 className="dash-header__title">Hello, {firstName} 👋</h1>
          <p className="dash-header__sub">What do you need today?</p>
        </div>
      </div>

      <div className="module-grid">
        {MODULES.map(m => (
          <Link
            key={m.href}
            href={m.href}
            className="module-card"
            style={{
              '--card-color':  m.color,
              '--card-bg':     m.bg,
              '--card-border': m.border,
            } as React.CSSProperties}
          >
            <div className="module-card__icon">{m.icon}</div>
            <div className="module-card__body">
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
            </div>
            <span className="module-card__arrow">→</span>
          </Link>
        ))}
      </div>

      <section className="upcoming-section">
        <h2 className="upcoming-section__title">Upcoming appointments</h2>
        <div className="empty-state">
          <span className="empty-state__icon">📅</span>
          <p>No upcoming appointments</p>
          <span>Book a doctor, lab test, or clinic visit above to get started.</span>
        </div>
      </section>

      <style>{`
        .dash-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }
        .dash-header__title {
          font-size: 24px;
          font-weight: 700;
          color: var(--myop-slate);
          letter-spacing: -0.5px;
        }
        .dash-header__sub {
          margin-top: 4px;
          font-size: 14px;
          color: var(--myop-muted);
        }

        .module-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 36px;
        }
        .module-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--card-bg, #fff);
          border: 1.5px solid var(--card-border, var(--myop-border));
          border-radius: 12px;
          cursor: pointer;
          text-decoration: none;
          transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
          color: inherit;
        }
        .module-card:hover {
          border-color: var(--card-color, var(--myop-teal));
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        .module-card__icon {
          font-size: 28px;
          flex-shrink: 0;
        }
        .module-card__body { flex: 1; }
        .module-card__body h3 {
          font-size: 15px;
          font-weight: 700;
          color: var(--myop-slate);
          margin-bottom: 3px;
        }
        .module-card__body p {
          font-size: 13px;
          color: var(--myop-muted);
          line-height: 1.4;
        }
        .module-card__arrow {
          color: var(--card-color, var(--myop-teal));
          font-size: 18px;
          flex-shrink: 0;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .module-card:hover .module-card__arrow { opacity: 1; }

        .upcoming-section__title {
          font-size: 17px;
          font-weight: 700;
          color: var(--myop-slate);
          letter-spacing: -0.3px;
          margin-bottom: 16px;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 40px;
          background: #fff;
          border: 1.5px dashed var(--myop-border);
          border-radius: 12px;
          text-align: center;
          color: var(--myop-muted);
          font-size: 14px;
        }
        .empty-state__icon { font-size: 28px; margin-bottom: 4px; }
        .empty-state p { font-weight: 600; color: var(--myop-slate); }
      `}</style>
    </>
  )
}