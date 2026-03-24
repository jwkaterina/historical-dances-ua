import { getFAQs } from "@/app/actions/faqs"
import { FaqContent } from "@/components/faq-content"
import { Header } from "@/components/header"

export default async function FaqPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const faqs = await getFAQs()
  const { from } = await searchParams
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <FaqContent faqs={faqs} fromBallName={from} />
        </div>
      </main>
    </>
  )
}
