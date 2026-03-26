/**
 * app/page.tsx
 * MYOP Healthcare Marketplace — Landing Page
 *
 * Public landing page. No auth required.
 * Green theme matching the original HTML design.
 */

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MYOP Health — Your Health, One Platform',
  description: 'Book doctors, lab tests, clinics and more near you.',
}

const SERVICES = [
  {
    label:    'Book OP',
    desc:     'Consult doctors instantly',
    href:     '/hospitals',
    emoji:    '🏥',
    built:    true,
    gradient: 'linear-gradient(135deg,#0d9488,#065f46)',
  },
  {
    label:    'Diagnostics',
    desc:     'Lab tests & reports',
    href:     '/book/diagnostic',
    emoji:    '🧪',
    built:    true,
    gradient: 'linear-gradient(135deg,#0891b2,#164e63)',
  },
  {
    label:    'Private Clinics',
    desc:     'Consult private clinics near you',
    href:     '/book/clinic',
    emoji:    '💊',
    built:    true,
    gradient: 'linear-gradient(135deg,#7c3aed,#4c1d95)',
  },
  {
    label:    'Pharmacy',
    desc:     'Order medicines',
    href:     '/coming-soon',
    emoji:    '💊',
    built:    false,
    gradient: 'linear-gradient(135deg,#d97706,#78350f)',
  },
  {
    label:    'Ambulance',
    desc:     'Emergency services',
    href:     '/coming-soon',
    emoji:    '🚑',
    built:    false,
    gradient: 'linear-gradient(135deg,#dc2626,#7f1d1d)',
  },
  {
    label:    'Mother & Child',
    desc:     'Care & consultation',
    href:     '/coming-soon',
    emoji:    '👶',
    built:    false,
    gradient: 'linear-gradient(135deg,#db2777,#831843)',
  },
]

const STEPS = [
  { icon: '🔍', label: 'Search Service' },
  { icon: '📅', label: 'Book Appointment' },
  { icon: '💳', label: 'Pay Securely' },
  { icon: '🏥', label: 'Get Treated' },
]

const STATS = [
  { value: '50K+', label: 'Patients' },
  { value: '500+', label: 'Doctors' },
  { value: '120+', label: 'Clinics' },
]

export default function LandingPage() {
  return (
    <div className="landing">

      {/* ── NAVBAR ── */}
      <nav className="landing-nav">
        <h3 className="landing-nav__logo">MYOP</h3>
        <div className="landing-nav__links">
          <a href="#services">Services</a>
          <a href="#how">How it Works</a>
          <Link href="/auth/login" className="landing-nav__cta">Sign in</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero">
        {/* <video className="hero-video" autoPlay muted loop playsInline>
          <source src="/images/4777995_Doctor_Patient_3840x2160.mp4" type="video/mp4" />
        </video> */}
        <div className="hero-content">
          <h1 className="hero-title">Your Health.<br />One Platform.</h1>
          <p className="hero-sub">
            Doctors, Diagnostics, Pharmacy and Ambulance — all in one place.
          </p>
          <div className="hero-actions">
            <Link href="/hospitals" className="hero-btn hero-btn--primary">
              Book a Doctor
            </Link>
            <Link href="/auth/signup" className="hero-btn hero-btn--ghost">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="services-section">
        <h2 className="section-title">Check what we have for you</h2>
        <div className="services-scroll">
          {SERVICES.map(s => (
            <Link
              key={s.label}
              href={s.href}
              className="service-card"
              style={{ background: s.gradient }}
            >
              <div className="service-card__emoji">{s.emoji}</div>
              <div className="service-card__body">
                <h3>{s.label}</h3>
                <p>{s.desc}</p>
              </div>
              {!s.built && (
                <span className="service-card__soon">Coming Soon</span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="how-section">
        <h2 className="how-section__title">How MYOP Works</h2>
        <div className="steps-wrapper">
          <div className="steps-line" />
          {STEPS.map((step, i) => (
            <div key={step.label} className="step">
              <div className="step-circle">{step.icon}</div>
              <p className="step-label">{step.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="stats-section">
        <h2 className="section-title">Trusted by thousands</h2>
        <div className="stats-grid">
          {STATS.map(s => (
            <div key={s.label} className="stat-card">
              <span className="stat-card__value">{s.value}</span>
              <span className="stat-card__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section className="testimonial-section">
        <h2 className="section-title">What Patients Say</h2>
        <div className="testimonial-card">
          <p className="testimonial-card__text">
            "Booking appointments has never been this easy.
            MYOP saves time and stress."
          </p>
          <span className="testimonial-card__author">— Patient, Kerala</span>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <h3>MYOP</h3>
        <p>A platform for all your medical needs</p>
        <div className="landing-footer__links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/register">List your facility</Link>
        </div>
      </footer>

      <style>{`
        /* ── Reset & base ── */
        .landing {
          font-family: 'Poppins', 'DM Sans', system-ui, sans-serif;
          background: #d8fce7;
          color: #1e1e1e;
          min-height: 100dvh;
        }

        /* ── Navbar ── */
        .landing-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 40px;
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(12px);
          z-index: 100;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .landing-nav__logo {
          font-size: 22px;
          font-weight: 700;
          color: #28a745;
          margin: 0;
        }
        .landing-nav__links {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .landing-nav__links a {
          text-decoration: none;
          color: #333;
          font-weight: 500;
          font-size: 14px;
          transition: color 0.15s;
        }
        .landing-nav__links a:hover { color: #28a745; }
        .landing-nav__cta {
          background: #28a745;
          color: #fff !important;
          padding: 8px 20px;
          border-radius: 30px;
          font-weight: 600 !important;
          transition: transform 0.2s, box-shadow 0.2s !important;
        }
        .landing-nav__cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(40,167,69,0.3);
        }

        /* ── Hero ── */
        .hero {
          position: relative;
          height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
          background: linear-gradient(120deg, #eafff4, #ffffff);
        }
        .hero-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.15;
          z-index: 0;
        }
        .hero-content {
          position: relative;
          z-index: 1;
          padding: 0 20px;
        }
        .hero-title {
          font-size: clamp(36px, 6vw, 64px);
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: 16px;
          color: #1e1e1e;
        }
        .hero-sub {
          font-size: clamp(16px, 2vw, 20px);
          color: #555;
          margin-bottom: 32px;
          max-width: 560px;
          margin-left: auto;
          margin-right: auto;
        }
        .hero-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .hero-btn {
          display: inline-flex;
          align-items: center;
          padding: 14px 32px;
          border-radius: 30px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .hero-btn:hover { transform: translateY(-3px); }
        .hero-btn--primary {
          background: #28a745;
          color: #fff;
          box-shadow: 0 8px 24px rgba(40,167,69,0.3);
        }
        .hero-btn--primary:hover {
          box-shadow: 0 12px 28px rgba(40,167,69,0.4);
        }
        .hero-btn--ghost {
          background: rgba(255,255,255,0.9);
          color: #28a745;
          border: 2px solid #28a745;
        }
        .hero-btn--ghost:hover {
          background: #28a745;
          color: #fff;
        }

        /* ── Sections ── */
        .services-section,
        .stats-section,
        .testimonial-section {
          padding: 80px 40px;
        }
        @media (max-width: 640px) {
          .services-section,
          .stats-section,
          .testimonial-section { padding: 60px 20px; }
        }
        .section-title {
          font-size: clamp(24px, 3vw, 32px);
          font-weight: 700;
          margin-bottom: 32px;
          color: #1e1e1e;
        }

        /* ── Service cards ── */
        .services-scroll {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          padding-bottom: 16px;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .services-scroll::-webkit-scrollbar { height: 6px; }
        .services-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .service-card {
          flex-shrink: 0;
          width: 280px;
          height: 360px;
          border-radius: 20px;
          padding: 28px;
          text-decoration: none;
          color: #fff;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          position: relative;
          overflow: hidden;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .service-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 24px 48px rgba(0,0,0,0.2);
        }
        .service-card__emoji {
          position: absolute;
          top: 28px;
          left: 28px;
          font-size: 48px;
          opacity: 0.9;
        }
        .service-card__body h3 {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 4px;
        }
        .service-card__body p {
          font-size: 13px;
          opacity: 0.85;
          margin: 0;
        }
        .service-card__soon {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(4px);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        /* ── How it works ── */
        .how-section {
          padding: 100px 20px;
          text-align: center;
          background: linear-gradient(135deg, #2c3e50, #2c3e50);
        }
        .how-section__title {
          font-size: clamp(24px, 3vw, 34px);
          font-weight: 700;
          color: #f8f9fc;
          margin-bottom: 48px;
        }
        .steps-wrapper {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 40px 32px;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 24px;
        }
        .steps-line {
          position: absolute;
          top: 68px;
          left: 10%;
          width: 80%;
          height: 3px;
          background: linear-gradient(90deg, #22c55e, #4ade80);
          z-index: 1;
        }
        .step {
          text-align: center;
          width: 110px;
          z-index: 2;
        }
        .step-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          margin: 0 auto 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .step-circle:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 20px rgba(34,197,94,0.5);
        }
        .step-label {
          font-size: 13px;
          font-weight: 500;
          color: #f1f5f9;
          margin: 0;
        }

        /* ── Stats ── */
        .stats-grid {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        .stat-card {
          flex: 1;
          min-width: 140px;
          background: #fff;
          border-radius: 16px;
          padding: 28px;
          text-align: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }
        .stat-card__value {
          display: block;
          font-size: 36px;
          font-weight: 800;
          color: #28a745;
          letter-spacing: -1px;
        }
        .stat-card__label {
          display: block;
          font-size: 14px;
          color: #555;
          margin-top: 4px;
        }

        /* ── Testimonial ── */
        .testimonial-card {
          max-width: 600px;
          margin: 0 auto;
          background: #fff;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          text-align: center;
        }
        .testimonial-card__text {
          font-size: 16px;
          color: #444;
          line-height: 1.7;
          margin: 0 0 12px;
          font-style: italic;
        }
        .testimonial-card__author {
          font-size: 13px;
          color: #888;
          font-weight: 500;
        }

        /* ── Footer ── */
        .landing-footer {
          background: #28a745;
          color: #fff;
          padding: 48px 40px;
          text-align: center;
        }
        .landing-footer h3 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px;
        }
        .landing-footer p {
          font-size: 14px;
          opacity: 0.85;
          margin: 0 0 20px;
        }
        .landing-footer__links {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .landing-footer__links a {
          color: rgba(255,255,255,0.8);
          text-decoration: none;
          font-size: 13px;
          transition: color 0.15s;
        }
        .landing-footer__links a:hover { color: #fff; }

        @media (max-width: 640px) {
          .landing-nav { padding: 12px 20px; }
          .steps-wrapper { flex-wrap: wrap; gap: 24px; justify-content: center; }
          .steps-line { display: none; }
        }
      `}</style>
    </div>
  )
}