'use client'

/**
 * app/(public)/_components/PublicNavClient.tsx
 * Client component — handles nav button interactivity.
 * Receives isLoggedIn from Server Component parent (no client-side auth fetch).
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Props {
  isLoggedIn: boolean
}

export default function PublicNavClient({ isLoggedIn }: Props) {
  if (isLoggedIn) {
    return (
      <Link href="/dashboard">
        <Button variant="outline" size="sm">
          My Dashboard
        </Button>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/login">
        <Button variant="ghost" size="sm">
          Log in
        </Button>
      </Link>
      <Link href="/signup">
        <Button size="sm">
          Sign up
        </Button>
      </Link>
    </div>
  )
}