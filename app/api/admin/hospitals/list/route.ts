/**
 * app/api/admin/hospitals/list/route.ts
 * Returns approved hospitals for the staff invite dropdown.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/domain'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json([], { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: UserRole }>()

  if (profile?.role !== 'admin') return NextResponse.json([], { status: 403 })

  const { data: hospitals } = await (supabase as any)
    .from('hospitals')
    .select('id, name, module')
    .eq('approval_status', 'approved')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return NextResponse.json(hospitals ?? [])
}