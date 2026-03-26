/**
 * app/coming-soon/page.tsx
 * Shown for services not yet built — Pharmacy, Ambulance, Mother & Child
 */

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Coming Soon — MYOP Health' }

export default function ComingSoonPage() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#d8fce7',
      fontFamily: "'Poppins', system-ui, sans-serif",
      padding: '24px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '56px 40px',
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 16px 48px rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🚧</div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#1e1e1e',
          marginBottom: 12,
          letterSpacing: '-0.5px',
        }}>
          Coming Soon
        </h1>
        <p style={{
          fontSize: 15,
          color: '#555',
          lineHeight: 1.6,
          marginBottom: 32,
        }}>
          We're working hard to bring this service to you.
          Check back soon!
        </p>
        <Link href="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '12px 28px',
          background: '#28a745',
          color: '#fff',
          borderRadius: 30,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: 15,
          transition: 'transform 0.2s',
        }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}