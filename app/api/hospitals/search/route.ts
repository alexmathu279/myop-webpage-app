/**
 * app/api/hospitals/search/route.ts
 *
 * GET /api/hospitals/search?q=query
 *
 * Called by the client-side HospitalsPage for debounced search.
 * Returns HospitalSearchResult[].
 * Public — no auth required.
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchHospitals } from '@/lib/booking/hospital'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''

  try {
    const hospitals = await searchHospitals(q)
    return NextResponse.json(hospitals)
  } catch (err) {
    console.error('[/api/hospitals/search] error:', err)
    return NextResponse.json([], { status: 500 })
  }
}