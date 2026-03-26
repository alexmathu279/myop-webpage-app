/**
 * app/(public)/hospitals/_components/HospitalCardSkeleton.tsx
 * Skeleton placeholder shown during Suspense loading.
 */

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function HospitalCardSkeleton() {
  return (
    <Card className="h-full border border-gray-200">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-100">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}