/**
 * app/(admin)/layout.tsx
 * MYOP Healthcare Marketplace — Admin Layout
 *
 * Fixes:
 *   - Hamburger menu with slide-in drawer on mobile
 *   - Sign out accessible on mobile
 *   - Active link highlighting via client component
 */

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types/domain'
import AdminLayoutClient from './_components/AdminLayoutClient'

export const metadata: Metadata = {
  title: { template: '%s — MYOP Admin', default: 'Admin' },
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single<{ full_name: string; role: UserRole }>()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { count: pendingCount } = await (supabase as any)
    .from('hospitals')
    .select('id', { count: 'exact', head: true })
    .eq('approval_status', 'pending')
    .is('deleted_at', null)

  const NAV_SECTIONS = [
    {
      label: 'Operations',
      links: [
        { href: '/admin/dashboard',         label: 'Dashboard',       icon: '⊞', badge: 0 },
        { href: '/admin/hospitals',         label: 'Hospitals',       icon: '🏥', badge: 0 },
        { href: '/admin/hospitals/pending', label: 'Pending Approval', icon: '⏳', badge: pendingCount ?? 0 },
      ],
    },
    {
      label: 'Platform',
      links: [
        { href: '/admin/staff', label: 'Staff & Invites', icon: '👥', badge: 0 },
      ],
    },
  ]

  const initials = profile?.full_name
    ? profile.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : 'A'

  return (
    <AdminLayoutClient
      navSections={NAV_SECTIONS}
      initials={initials}
      fullName={profile?.full_name ?? 'Admin'}
    >
      {children}
    </AdminLayoutClient>
  )
}