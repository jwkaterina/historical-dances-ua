import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { MusicContent } from "@/components/music-content"

interface MusicPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function MusicPage({ searchParams }: MusicPageProps) {
  const supabase = await createClient()
  const { q: query } = await searchParams

  // Fetch music with associated dance names through the junction table
  const { data: musicWithDances, error } = await supabase
    .from("music")
    .select(`
      *,
      dance_music(
        dances(id, name, name_de, name_ru)
      )
    `)
    .order("title")

  // Filter by dance name if query is provided (search in all name fields)
  let music = musicWithDances
  if (query && musicWithDances) {
    const lowerQuery = query.toLowerCase()
    music = musicWithDances.filter((track) => {
      const dances = track.dance_music?.map((dm: any) => dm.dances).filter(Boolean) || []
      return dances.some((dance: any) => 
        dance.name?.toLowerCase().includes(lowerQuery) ||
        dance.name_de?.toLowerCase().includes(lowerQuery) ||
        dance.name_ru?.toLowerCase().includes(lowerQuery)
      )
    })
  }

  if (error) {
    console.error("Error fetching music:", error)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <MusicContent music={music || []} query={query} />
      </main>
    </div>
  )
}
