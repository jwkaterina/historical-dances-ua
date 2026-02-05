import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { notFound } from "next/navigation"
import { DanceDetailContent } from "@/components/dance-detail-content"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ballId?: string }>
}

// Disable caching for this page so updates are always fresh
export const revalidate = 0

export default async function DanceDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { ballId } = await searchParams
  const supabase = await createClient()

  // Fetch dance details
  const { data: dance, error: danceError } = await supabase
    .from("dances")
    .select("*")
    .eq("id", id)
    .single()

  if (danceError || !dance) {
    notFound()
  }

  // Fetch associated music through the junction table
  const { data: danceMusic } = await supabase
    .from("dance_music")
    .select(`
      music:music_id (
        id,
        title,
        artist,
        tempo,
        genre,
        audio_url
      )
    `)
    .eq("dance_id", id)

  // Get all music tracks and filter to only those with audio files
  const allMusicTracks = danceMusic?.map((dm) => dm.music).filter(Boolean) || []
  const musicTracks = allMusicTracks.filter((track: any) => track.audio_url && track.audio_url.trim() !== '')

  // Transform music tracks for the edit form (already filtered to only tracks with audio)
  const musicForEdit = musicTracks.map((track: any) => ({
    id: track.id,
    title: track.title || "",
    artist: track.artist || "",
    tempo: track.tempo ? String(track.tempo) : "",
    genre: track.genre || "",
    audio_url: track.audio_url || "",
  }))

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <DanceDetailContent 
          dance={dance} 
          musicTracks={musicTracks} 
          musicForEdit={musicForEdit}
          ballId={ballId}
        />
      </main>
    </div>
  )
}
