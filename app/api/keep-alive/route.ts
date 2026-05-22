//**
 //* app/api/keep-alive/route.ts
 //*
 //* Pings the DB every 4 minutes via Vercel cron to prevent
 //* Supabase free tier from pausing the database.
 //*
 //* Setup in vercel.json:
 //* {
 //*   "crons": [{ "path": "/api/keep-alive", "schedule": "*/4 * * * *" }]
 //* }
 //*
// * This costs $0 — Vercel cron is free up to 2 jobs.
 //* Eliminates the 3-8 second cold start on first visit.
 //*/

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createServiceClient()
    // Lightweight ping — just count approved hospitals
    const { count } = await (supabase as any)
      .from('hospitals')
      .select('id', { count: 'exact', head: true })
      .eq('approval_status', 'approved')
      .limit(1)

    return NextResponse.json({ ok: true, count, ts: new Date().toISOString() })
  } catch (err) {
    console.error('[keep-alive] error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}