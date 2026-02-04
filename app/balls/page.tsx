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
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Suspense fallback={<div>Loading...</div>}>
            <BallsContent balls={balls} dances={dances} query={searchParams?.q} />
          </Suspense>
        </div>
      </main>
    </>
  )
}

export default BallsPage
