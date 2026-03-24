import { Header } from "@/components/header"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Title + description */}
        <div className="mb-8">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>

        {/* Search bar + category filter */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-[180px] self-end" />
        </div>

        {/* Tutorial cards grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="aspect-video w-full rounded-lg" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
