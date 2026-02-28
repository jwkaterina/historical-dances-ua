import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { notFound } from "next/navigation"
import { TutorialDetailContent } from "@/components/tutorial-detail-content"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ danceId?: string }>
}

export default async function TutorialDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { danceId } = await searchParams
  const supabase = await createClient()

  const { data: tutorial, error } = await supabase
    .from("tutorials")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !tutorial) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <TutorialDetailContent tutorial={tutorial} danceId={danceId} />
      </main>
    </div>
  )
}
