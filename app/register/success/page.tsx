/**
 * app/register/success/page.tsx
 */

export default function RegisterSuccessPage() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: '#f8fafc', padding: '24px',
    }}>
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: 16, padding: '48px 40px',
        maxWidth: 480, width: '100%', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.5px' }}>
          Application submitted!
        </h1>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, marginBottom: 28 }}>
          Thank you for registering with MYOP Health. Our team will review your
          application and contact you at your registered email within 2 business days.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            background: '#0d9488', color: '#fff',
            padding: '12px 28px', borderRadius: 6,
            textDecoration: 'none', fontWeight: 700, fontSize: 14,
          }}
        >
          Back to home
        </a>
      </div>
    </div>
  )
}