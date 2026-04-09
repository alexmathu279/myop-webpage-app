/**
 * app/(public)/book/clinic/_components/ClinicCardSkeleton.tsx
 */

export default function ClinicCardSkeleton() {
  return (
    <div className="h-full bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-14 h-14 rounded-xl bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-1/2 bg-gray-200 rounded" />
          <div className="h-3 w-2/3 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-5/6 bg-gray-200 rounded" />
      </div>
      <div className="flex justify-between pt-3 border-t border-gray-100">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
    </div>
  )
}