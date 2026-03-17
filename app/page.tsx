import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { HomeContent } from "@/components/home-content"

interface HomePageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const supabase = await createClient()
  const { q: query } = await searchParams

  let queryBuilder = supabase.from("dances").select("*")

  if (query) {
    // Search in all name fields (base, German, Russian)
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,name_ua.ilike.%${query}%,name_ru.ilike.%${query}%`)
  }

  const { data: dances, error } = await queryBuilder.order("name")

  if (error) {
    console.error("Error fetching dances:", error)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <HomeContent dances={dances || []} query={query} />
      </main>
    </div>
  )
}
