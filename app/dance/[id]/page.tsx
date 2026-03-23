import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { notFound } from "next/navigation"
import { DanceDetailContent } from "@/components/dance-detail-content"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ballId?: string; from?: string }>
}

// Disable caching for this page so updates are always fresh
export const revalidate = 0

export default async function DanceDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { ballId, from } = await searchParams
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
  const allMusicTracks = danceMusic?.map((dm) => dm.music).filter(Boolean) as any[] || []
  const musicTracks: any[] = allMusicTracks.filter((track: any) => track.audio_url && track.audio_url.trim() !== '')

  // Transform music tracks for the edit form (already filtered to only tracks with audio)
  const musicForEdit = musicTracks.map((track: any) => ({
    id: track.id,
    title: track.title || "",
    artist: track.artist || "",
    tempo: track.tempo ? String(track.tempo) : "",
    genre: track.genre || "",
    audio_url: track.audio_url || "",
  }))

  // Fetch dance videos
  const { data: danceVideos } = await supabase
    .from("dance_videos")
    .select("id, video_type, url, order_index")
    .eq("dance_id", id)
    .order("order_index", { ascending: true })

  // Transform videos for edit form
  const videosForEdit = (danceVideos || []).map((video: any) => ({
    id: video.id,
    video_type: video.video_type,
    url: video.url,
  }))

  // Fetch figures and their videos
  const { data: figureRows } = await supabase
    .from('dance_figures')
    .select('id, order_index, scheme_ua, scheme_ru')
    .eq('dance_id', id)
    .order('order_index', { ascending: true })

  let figures: any[] = []
  if (figureRows && figureRows.length > 0) {
    const figureIds = figureRows.map((f: any) => f.id)
    const { data: videosRows } = await supabase
      .from('figure_videos')
      .select('id, figure_id, video_type, url, order_index')
      .in('figure_id', figureIds)
      .order('order_index', { ascending: true })
    const vidsByFigure: Record<string, any[]> = {}
    ;(videosRows || []).forEach((v: any) => {
      vidsByFigure[v.figure_id] = vidsByFigure[v.figure_id] || []
      vidsByFigure[v.figure_id].push({ id: v.id, video_type: v.video_type, url: v.url })
    })
    figures = figureRows.map((f: any) => ({ id: f.id, order_index: f.order_index, scheme_ua: f.scheme_ua, scheme_ru: f.scheme_ru, videos: vidsByFigure[f.id] || [] }))
  }

  // Fetch linked tutorials
  const { data: danceTutorialRows } = await supabase
    .from('dance_tutorials')
    .select('tutorial_id, tutorials:tutorial_id (id, title_ua, title_ru, url, type)')
    .eq('dance_id', id)

  const linkedTutorials = (danceTutorialRows || [])
    .map((r: any) => r.tutorials)
    .filter(Boolean) as { id: string; title_ua: string; title_ru: string; url: string; type: string }[]

  const linkedTutorialIds = linkedTutorials.map(t => t.id)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <DanceDetailContent
          dance={dance}
          musicTracks={musicTracks}
          musicForEdit={musicForEdit}
          videos={danceVideos || []}
          videosForEdit={videosForEdit}
          ballId={ballId}
          from={from}
          figures={figures}
          linkedTutorials={linkedTutorials}
          linkedTutorialIds={linkedTutorialIds}
        />
      </main>
    </div>
  )
}
