import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const danceId = searchParams.get("danceId")
    if (!danceId) {
        return NextResponse.json({ error: "danceId is required" }, { status: 400 })
    }

    const supabase = await createClient()
    // Fetch music with associated dances via dance_music, then filter by danceId
    const { data, error } = await supabase
        .from("music")
        .select(`
      id, title, artist, audio_url,
      dance_music(dance_id)
    `)
        .order("title")

    if (error) {
        return NextResponse.json({ error: "Failed to fetch tracks" }, { status: 500 })
    }
    const tracksForDance = (data || []).filter((track: any) =>
        (track.dance_music || []).some((dm: any) => dm?.dance_id === danceId)
    )

    // Shape to the client MusicTrack interface
    const result = tracksForDance.map((t: any) => ({
        id: t.id,
        title: t.title,
        artist: t.artist ?? null,
        audio_url: t.audio_url ?? null,
    }))

    return NextResponse.json(result, { status: 200 })
}