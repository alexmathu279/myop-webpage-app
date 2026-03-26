/**
 * next.config.ts
 * MYOP Healthcare Marketplace
 *
 * SECURITY:
 *   ✓ HTTP security headers via headers()
 *   ✓ No hardcoded secrets — all from environment variables
 *   ✓ Images restricted to known domains
 *   ✓ Powered-By header removed
 */

import type { NextConfig } from 'next'
import { getNextConfigHeaders } from '@/lib/security/headers'

const nextConfig: NextConfig = {
  // -------------------------------------------------------------------------
  // Security headers applied to all routes
  // -------------------------------------------------------------------------
  async headers() {
    return getNextConfigHeaders()
  },

  // -------------------------------------------------------------------------
  // Remove X-Powered-By header — don't advertise Next.js version
  // -------------------------------------------------------------------------
  poweredByHeader: false,

  // -------------------------------------------------------------------------
  // Restrict image sources to known domains (SSRF prevention)
  // -------------------------------------------------------------------------
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname:  '**.supabase.co',
        pathname:  '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname:  'lh3.googleusercontent.com',  // Google avatars if OAuth added later
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Strict mode for React — catches potential issues early
  // -------------------------------------------------------------------------
  reactStrictMode: true,

  // -------------------------------------------------------------------------
  // Compiler options
  // -------------------------------------------------------------------------
  compiler: {
    // Remove console.log in production (but keep console.error/warn)
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
}

export default nextConfig