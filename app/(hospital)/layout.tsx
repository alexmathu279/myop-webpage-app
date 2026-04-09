/**
 * app/(hospital)/layout.tsx
 * MYOP Healthcare Marketplace — Hospital Staff Layout
 *
 * Fixes:
 *   - Hamburger menu with slide-in sidebar on mobile
 *   - Sign out accessible on mobile
 *   - Next.js <Link> for client-side navigation (faster)
 *   - Mobile bottom nav for quick access
 */

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types/domain'
import HospitalLayoutClient from './_components/HospitalLayoutClient'

export const metadata: Metadata = {
  title: { template: '%s — MYOP Staff', default: 'Staff Dashboard' },
}

export default async function HospitalLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single<{ full_name: string; role: UserRole }>()

  if (profile?.role !== 'hospital_staff' && profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: staffRecord } = await (supabase as any)
    .from('hospital_staff')
    .select('hospital_id, hospitals(name, module)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single()

  const hospitalName   = staffRecord?.hospitals?.name   ?? 'Your Hospital'
  const hospitalModule = staffRecord?.hospitals?.module ?? 'hospital'

  const initials = profile?.full_name
    ? profile.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : 'S'

  const NAV = [
    { href: '/hospital/dashboard',    label: 'Overview',     icon: '⊞' },
    { href: '/hospital/appointments', label: 'Appointments', icon: '📋' },
    { href: '/hospital/doctors',      label: 'Doctors',      icon: '👨‍⚕️', hideFor: ['diagnostic'] },
    { href: '/hospital/services',     label: 'Services',     icon: '🧪', showFor: ['diagnostic', 'clinic'] },
  ].filter(link => {
    if (link.hideFor?.includes(hospitalModule)) return false
    if (link.showFor && !link.showFor.includes(hospitalModule)) return false
    return true
  })

  return (
    <HospitalLayoutClient
      hospitalName={hospitalName}
      initials={initials}
      fullName={profile?.full_name ?? 'Staff'}
      nav={NAV}
    >
      {children}
    </HospitalLayoutClient>
  )
}