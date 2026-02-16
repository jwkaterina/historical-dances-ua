import { getBallById } from "@/app/actions/ball"
import { BallInfoContent } from "@/components/ball-info-content"
import { Header } from "@/components/header"
import { notFound } from "next/navigation"

async function BallInfoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const ball = await getBallById(id)

    if (!ball) {
      notFound()
    }

    return (
      <>
        <Header />
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <BallInfoContent ball={ball} />
          </div>
        </main>
      </>
    )
  } catch (error) {
    console.error("[v0] Ball info error:", error)
    notFound()
  }
}

export default BallInfoPage
