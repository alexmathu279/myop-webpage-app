/**
 * app/(public)/book/diagnostic/loading.tsx
 */

export default function DiagnosticLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="text-center mb-10">
        <div className="h-9 w-56 bg-gray-200 rounded-lg mx-auto mb-3" />
        <div className="h-5 w-80 bg-gray-100 rounded mx-auto" />
      </div>
      <div className="max-w-xl mx-auto mb-8">
        <div className="h-11 w-full bg-gray-200 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-100">
              <div className="h-3 w-24 bg-gray-100 rounded" />
              <div className="h-5 w-20 bg-gray-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}