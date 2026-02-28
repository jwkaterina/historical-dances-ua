import { Suspense } from "react"
import { Header } from "@/components/header"
import { BallsContent } from "@/components/balls-content"
import { getBalls, getDancesForBall } from "@/app/actions/ball"

interface SearchParams {
  q?: string
}

async function BallsPage({ searchParams }: { searchParams: SearchParams }) {
  const [balls, dances] = await Promise.all([
    getBalls(),
    getDancesForBall(),
  ])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Suspense fallback={<div>Loading...</div>}>
          <BallsContent balls={balls} dances={dances} query={searchParams?.q} />
        </Suspense>
      </main>
    </div>
  )
}

export default BallsPage
