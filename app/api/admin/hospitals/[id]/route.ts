/**
 * app/api/admin/hospitals/[id]/route.ts
 * MYOP Healthcare Marketplace
 *
 * REST endpoint for hospital detail data.
 * Used by the admin hospital detail page client component.
 * Admin-only — verifies role before returning data.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applySecurityHeaders } from '@/lib/security'
import type { UserRole } from '@/types/domain'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: UserRole }>()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: hospital, error } = await (supabase as any)
    .from('hospitals')
    .select(`
      id, name, module, approval_status,
      email, phone, website,
      address_line1, address_line2, city, state, pincode,
      description, rejection_reason,
      suspended_at, created_at, approved_at
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !hospital) {
    return NextResponse.json({ error: 'Hospital not found' }, { status: 404 })
  }

  const response = NextResponse.json(hospital)
  applySecurityHeaders(response.headers, { noCache: true })
  return response
}