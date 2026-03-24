import { Header } from "@/components/header"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Title + description */}
        <div className="mb-8">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="mt-2 h-5 w-60" />
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Music cards grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-3">
                <div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="mt-1 h-4 w-1/2" />
                  <div className="flex gap-2 mt-3">
                    <Skeleton className="h-6 w-16 rounded" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
