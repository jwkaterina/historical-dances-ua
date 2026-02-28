import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { TutorialsContent } from "@/components/tutorials-content"

interface TutorialsPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function TutorialsPage({ searchParams }: TutorialsPageProps) {
  const supabase = await createClient()
  const { q: query } = await searchParams

  const [{ data: tutorials, error }, { data: categories }] = await Promise.all([
    supabase.from("tutorials").select("*").order("created_at", { ascending: false }),
    supabase.from("tutorial_categories").select("*").order("name_de"),
  ])

  if (error) {
    console.error("Error fetching tutorials:", error)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <TutorialsContent
          tutorials={tutorials || []}
          categories={categories || []}
          query={query}
        />
      </main>
    </div>
  )
}
