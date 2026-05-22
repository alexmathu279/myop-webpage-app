/**
 * lib/security/headers.ts
 * MYOP Healthcare Marketplace
 */

function buildCSP(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  // Extract just the hostname for CSP (e.g. rzdfmunxomufjftwirxq.supabase.co)
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : '*.supabase.co'

  const directives: Record<string, string[]> = {
    'default-src':  ["'self'"],
    'script-src':   [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'https://checkout.razorpay.com',
      'https://api.razorpay.com',
    ],
    'style-src':    ["'self'", "'unsafe-inline'"],
    'img-src':      ["'self'", 'data:', 'blob:', 'https:'],
    'font-src':     ["'self'", 'data:'],
    // ── media-src: allow Supabase storage videos ──
    'media-src':    ["'self'", `https://${supabaseHost}`, 'https://*.supabase.co'],
    'connect-src':  [
      "'self'",
      supabaseUrl,
      'https://api.razorpay.com',
      'wss://*.supabase.co',
    ].filter(Boolean),
    'frame-src':    [
      'https://api.razorpay.com',
      'https://checkout.razorpay.com',
    ],
    'object-src':      ["'none'"],
    'base-uri':        ["'self'"],
    'form-action':     ["'self'"],
    'frame-ancestors': ["'none'"],
  }

  return Object.entries(directives)
    .map(([key, values]) => values.length > 0 ? `${key} ${values.join(' ')}` : key)
    .join('; ')
}

export const SECURITY_HEADERS = {
  'X-DNS-Prefetch-Control':    'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options':           'DENY',
  'X-Content-Type-Options':    'nosniff',
  'X-XSS-Protection':          '1; mode=block',
  'Referrer-Policy':           'strict-origin-when-cross-origin',
  'Permissions-Policy':        [
    'camera=()',
    'microphone=()',
    'geolocation=(self)',
    'payment=(self https://checkout.razorpay.com)',
    'usb=()',
  ].join(', '),
  'Content-Security-Policy': buildCSP(),
}

export const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma':        'no-cache',
  'Expires':       '0',
}

export function applySecurityHeaders(
  headers: Headers,
  options?: { noCache?: boolean },
): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value)
  }
  if (options?.noCache) {
    for (const [key, value] of Object.entries(NO_CACHE_HEADERS)) {
      headers.set(key, value)
    }
  }
}

export function getNextConfigHeaders() {
  const headersList = Object.entries(SECURITY_HEADERS).map(([key, value]) => ({ key, value }))
  return [
    { source: '/(.*)', headers: headersList },
    {
      source: '/(dashboard|bookings|profile|payments|hospital|admin)(.*)',
      headers: Object.entries(NO_CACHE_HEADERS).map(([key, value]) => ({ key, value })),
    },
  ]
}