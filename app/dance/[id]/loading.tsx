import { Header } from "@/components/header"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Back button */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Title + stars + icons row */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-5 w-20" />
            <div className="ml-auto flex gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-36" />
        </div>

        {/* Video area */}
        <div className="mb-8">
          <Skeleton className="aspect-video w-full max-w-3xl rounded-lg" />
        </div>

        {/* Description card */}
        <div className="rounded-lg border bg-card mb-8">
          <div className="p-6 pb-4">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="px-6 pb-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        </div>

        {/* Scheme card */}
        <div className="rounded-lg border bg-card mb-8">
          <div className="p-6 pb-4">
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="px-6 pb-6">
            <Skeleton className="h-32 w-full rounded-md" />
          </div>
        </div>

        {/* Music card */}
        <div className="rounded-lg border bg-card">
          <div className="p-6 pb-4">
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="px-6 pb-6 space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-4 bg-muted rounded-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
