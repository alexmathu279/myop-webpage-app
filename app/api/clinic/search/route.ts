/**
 * app/api/clinic/search/route.ts
 * Public — no auth required.
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchClinics } from '@/lib/booking/clinic'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  try {
    const clinics = await searchClinics(q)
    return NextResponse.json(clinics)
  } catch (err) {
    console.error('[/api/clinic/search] error:', err)
    return NextResponse.json([], { status: 500 })
  }
}