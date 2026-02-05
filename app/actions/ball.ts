"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface SectionDanceEntry {
  danceId: string
  musicId?: string | null
}

interface Section {
  id?: string
  name: string
  name_de: string
  name_ru: string
  dances: SectionDanceEntry[]
}

interface BallData {
  name: string
  name_de: string
  name_ru: string
  date: string
  place_de: string
  place_ru: string
  sections: Section[]
}

export async function getBalls() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("balls")
      .select(
        `
        id,
        name,
        name_de,
        name_ru,
        date,
        place,
        place_de,
        place_ru,
        created_at,
        ball_sections (
          id,
          section_dances (
            id
          )
        )
      `
      )
      .order("date", { ascending: false })

    if (error) {
      console.log("[v0] Ball fetch error:", error)
      return []
    }
    
    // Calculate dance count from ball_sections and section_dances
    const ballsWithCounts = (data || []).map(ball => ({
      ...ball,
      ball_dances: ball.ball_sections?.flatMap((section: any) => section.section_dances || []) || []
    }))
    
    return ballsWithCounts
  } catch (error) {
    console.log("[v0] Ball fetch exception:", error)
    return []
  }
}

export async function getBallById(id: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("balls")
      .select(
        `
        id,
        name,
        name_de,
        name_ru,
        date,
        place,
        place_de,
        place_ru,
        created_at,
        user_id,
        ball_sections (
          id,
          name,
          name_de,
          name_ru,
          order_index,
          section_dances (
            id,
            dances (
              id,
              name,
              name_de,
              name_ru,
              difficulty
            ),
            order_index,
            music_id,
            music:music_id (
              id,
              title,
              artist,
              audio_url
            )
          )
        )
      `
      )
      .eq("id", id)
      .single()

    if (error) {
      console.log("[v0] Ball get error:", error)
      return null
    }
    return data
  } catch (error) {
    console.log("[v0] Ball get exception:", error)
    return null
  }
}

export async function createBall(ballData: BallData) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Create ball
    const { data: ball, error: ballError } = await supabase
      .from("balls")
      .insert({
        name: ballData.name,
        name_de: ballData.name_de,
        name_ru: ballData.name_ru,
        date: ballData.date,
        place: ballData.place_de, // Use German city as primary place
        place_de: ballData.place_de,
        place_ru: ballData.place_ru,
        user_id: user.id,
      })
      .select()
      .single()

    if (ballError) throw ballError

    // Create sections with dances if any sections exist
    if (ballData.sections && ballData.sections.length > 0) {
      for (const section of ballData.sections) {
        try {
          const { data: sectionData, error: sectionError } = await supabase
            .from("ball_sections")
            .insert({
              ball_id: ball.id,
              name: section.name,
              name_de: section.name_de,
              name_ru: section.name_ru,
            })
            .select()
            .single()

          if (sectionError) {
            console.log("[v0] Section creation error (non-fatal):", sectionError)
            continue
          }

          // Add dances to section
          if (section.dances.length > 0) {
            const dancesToInsert = section.dances.map((entry, index) => ({
              section_id: sectionData.id,
              dance_id: entry.danceId,
              order_index: index,
              music_id: entry.musicId || null,
            }))

            const { error: dancesError } = await supabase
              .from("section_dances")
              .insert(dancesToInsert)

            if (dancesError) {
              console.log("[v0] Adding dances error (non-fatal):", dancesError)
            }
          }
        } catch (sectionError) {
          console.log("[v0] Section processing error (non-fatal):", sectionError)
          // Continue creating other sections even if one fails
        }
      }
    }

    revalidatePath("/balls")
    return ball
  } catch (error) {
    console.log("[v0] Create ball error:", error)
    throw error
  }
}

export async function updateBall(id: string, ballData: BallData) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Update ball
    const { error: ballError } = await supabase
      .from("balls")
      .update({
        name: ballData.name,
        name_de: ballData.name_de,
        name_ru: ballData.name_ru,
        date: ballData.date,
        place: ballData.place_de,
        place_de: ballData.place_de,
        place_ru: ballData.place_ru,
      })
      .eq("id", id)

    if (ballError) throw ballError

    // Delete existing sections
    const { error: deleteError } = await supabase
      .from("ball_sections")
      .delete()
      .eq("ball_id", id)

    if (deleteError) throw deleteError

    // Create new sections with dances
    for (const section of ballData.sections) {
      const { data: sectionData, error: sectionError } = await supabase
        .from("ball_sections")
        .insert({
          ball_id: id,
          name: section.name,
          name_de: section.name_de,
          name_ru: section.name_ru,
        })
        .select()
        .single()

      if (sectionError) throw sectionError

      // Add dances to section
      if (section.dances.length > 0) {
        const dancesToInsert = section.dances.map((entry, index) => ({
          section_id: sectionData.id,
          dance_id: entry.danceId,
          order_index: index,
          music_id: entry.musicId || null,
        }))

        const { error: dancesError } = await supabase
          .from("section_dances")
          .insert(dancesToInsert)

        if (dancesError) throw dancesError
      }
    }

    revalidatePath("/balls")
    revalidatePath(`/balls/${id}`)
  } catch (error) {
    console.log("[v0] Update ball error:", error)
    throw error
  }
}

export async function deleteBall(id: string) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { error } = await supabase.from("balls").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/balls")
  } catch (error) {
    console.log("[v0] Delete ball error:", error)
    throw error
  }
}

export async function getDancesForBall() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("dances")
      .select(`
        id, 
        name, 
        name_de, 
        name_ru, 
        difficulty,
        dance_music (
          music:music_id (
            id,
            title,
            artist,
            audio_url
          )
        )
      `)
      .order("name", { ascending: true })

    if (error) {
      console.log("[v0] Dances fetch error:", error)
      return []
    }
    
    // Transform data to include music tracks array
    const dancesWithMusic = (data || []).map(dance => ({
      ...dance,
      musicTracks: dance.dance_music
        ?.map((dm: any) => dm.music)
        .filter((m: any) => m && m.audio_url) || []
    }))
    
    return dancesWithMusic
  } catch (error) {
    console.log("[v0] Dances fetch exception:", error)
    return []
  }
}

export async function getExistingCities() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("balls")
      .select("place")
      .not("place", "is", null)

    if (error) {
      console.log("[v0] Cities fetch error:", error)
      return []
    }

    // Get unique cities and remove duplicates
    const uniqueCities = Array.from(
      new Set(data?.map(ball => ball.place).filter(Boolean))
    ) as string[]

    console.log("[v0] Existing cities:", uniqueCities)
    return uniqueCities.sort()
  } catch (error) {
    console.log("[v0] Cities fetch exception:", error)
    return []
  }
}
