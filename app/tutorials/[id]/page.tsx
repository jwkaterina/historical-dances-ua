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

  const [{ data: tutorial, error }, { data: categories }] = await Promise.all([
    supabase.from("tutorials").select("*").eq("id", id).single(),
    supabase.from("tutorial_categories").select("*").order("name_ua"),
  ])

  if (error || !tutorial) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <TutorialDetailContent tutorial={tutorial} categories={categories || []} danceId={danceId} />
      </main>
    </div>
  )
}
