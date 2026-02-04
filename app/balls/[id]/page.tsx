import { getBallById, getDancesForBall } from "@/app/actions/ball"
import { BallDetailContent } from "@/components/ball-detail-content"
import { Header } from "@/components/header"
import { notFound } from "next/navigation"

async function BallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const [ball, allDances] = await Promise.all([
      getBallById(id),
      getDancesForBall(),
    ])

    if (!ball) {
      notFound()
    }

    return (
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <BallDetailContent ball={ball} allDances={allDances} />
          </div>
        </main>
      </>
    )
  } catch (error) {
    console.error("[v0] Ball detail error:", error)
    notFound()
  }
}

export default BallPage
