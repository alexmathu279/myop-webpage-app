/**
 * next.config.ts
 * MYOP Healthcare Marketplace
 */

import type { NextConfig } from 'next'
import { getNextConfigHeaders } from '@/lib/security/headers'

const nextConfig: NextConfig = {
  async headers() {
    const securityHeaders = await getNextConfigHeaders()

    const staticAssetHeaders = [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/favicon.ico',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
    ]

    return [...securityHeaders, ...staticAssetHeaders]
  },

  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        // Allow ALL public Supabase storage paths — covers any bucket/folder structure
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/**',   // ← was '/storage/v1/object/public/**' which blocked subfolder paths
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    formats:         ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
  },

  reactStrictMode: true,

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
}

export default nextConfig