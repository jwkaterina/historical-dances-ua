import { Header } from "@/components/header"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="space-y-6">
            {/* Back button */}
            <Skeleton className="h-9 w-32" />

            {/* Title + date/place */}
            <div>
              <Skeleton className="h-9 w-64" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>

            {/* FAQ link */}
            <Skeleton className="h-5 w-36" />

            {/* Section cards */}
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card">
                <div className="p-6 pb-4">
                  <Skeleton className="h-6 w-40" />
                </div>
                <div className="px-6 pb-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-4 py-3">
                      <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
