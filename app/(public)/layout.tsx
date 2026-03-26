/**
 * app/(public)/layout.tsx
 * Public layout — no authentication required.
 * Wraps /hospitals and other public-facing pages.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PublicNavClient from './_components/PublicNavClient'

export const metadata: Metadata = {
  title: { default: 'MYOP Healthcare', template: '%s | MYOP Healthcare' },
  description: 'Find and book healthcare appointments near you.',
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Optionally read auth state — nav shows login or dashboard link
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-blue-600 tracking-tight">
                MYOP
              </span>
              <span className="hidden sm:inline text-sm text-gray-500 font-medium">
                Healthcare
              </span>
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/hospitals" className="hover:text-blue-600 transition-colors">
                Find Doctors
              </Link>
              <Link href="/book/diagnostic" className="hover:text-blue-600 transition-colors">
                Diagnostics
              </Link>
              <Link href="/book/clinic" className="hover:text-blue-600 transition-colors">
                Clinics
              </Link>
            </nav>

            {/* Auth CTA — client component handles interactivity */}
            <PublicNavClient isLoggedIn={!!user} />
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} MYOP Healthcare. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-gray-800 transition-colors">Privacy</Link>
              <Link href="/terms"   className="hover:text-gray-800 transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-gray-800 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}