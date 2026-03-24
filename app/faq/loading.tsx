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

            {/* Title + description */}
            <div>
              <Skeleton className="h-9 w-24" />
              <Skeleton className="mt-2 h-5 w-64" />
            </div>

            {/* Accordion items */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-b py-4">
                <Skeleton className="h-5 w-full max-w-md" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
