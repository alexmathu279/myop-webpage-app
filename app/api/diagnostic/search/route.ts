/**
 * app/api/diagnostic/search/route.ts
 * Public — no auth required.
 * GET /api/diagnostic/search?q=query
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchDiagnosticCentres } from '@/lib/booking/diagnostic'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  try {
    const centres = await searchDiagnosticCentres(q)
    return NextResponse.json(centres)
  } catch (err) {
    console.error('[/api/diagnostic/search] error:', err)
    return NextResponse.json([], { status: 500 })
  }
}