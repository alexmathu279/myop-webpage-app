'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
  const params = useSearchParams()
  const reason = params.get('reason') ?? 'Something went wrong.'

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '40px 32px',
      textAlign: 'center',
      maxWidth: 440,
      margin: '0 auto',
    }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>⚠</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
        Authentication failed
      </h2>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
        {reason.includes('PKCE')
          ? 'The confirmation link has expired or was opened in a different browser. Please sign up again.'
          : reason}
      </p>
      
       <a href="/auth/login"
        style={{
          display: 'inline-block',
          background: '#0d9488',
          color: '#fff',
          padding: '10px 24px',
          borderRadius: 6,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        Back to sign in
      </a>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  )
}