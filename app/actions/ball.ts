"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface SectionText {content_de: string
  content_ru: string
}

interface SectionDanceEntry {
  danceId: string
  musicIds?: string[]
}

interface Section {
  id?: string
  name: string
  name_de: string
  name_ru: string
  dances?: SectionDanceEntry[]
  texts?: SectionText[]
  entries?: Array<{
    kind: 'dance' | 'text'
    order_index: number
    danceId?: string
    musicIds?: string[]
    content_de?: string
    content_ru?: string
  }>
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
          name,
          name_de,
          name_ru,
          order_index,
          section_dances (
            id,
            order_index,
            dance_id,
            music_ids,
            dances:dance_id (
              id,
              name,
              name_de,
              name_ru,
              difficulty
            )
          ),
          section_texts (
            id,
            order_index,
            content_de,
            content_ru
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
    const ballsWithCounts = (data || []).map((ball: any) => ({
      ...ball,
      ball_dances:
          ball.ball_sections?.flatMap((section: any) => section.section_dances || []) || []
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
        info_ru,
        info_de,
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
            order_index,
            dance_id,
            music_ids,
            dances:dance_id (
              id,
              name,
              name_de,
              name_ru,
              difficulty
            )
          ),section_texts (
            id,
            order_index,
            content_de,
            content_ru
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

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data: ball, error: ballError } = await supabase
        .from("balls")
        .insert({
          name: ballData.name,
          name_de: ballData.name_de,
          name_ru: ballData.name_ru,
          date: ballData.date,
          place: ballData.place_de,
          place_de: ballData.place_de,
          place_ru: ballData.place_ru,
          user_id: user.id,
        })
        .select()
        .single()

    if (ballError) throw ballError

    if (ballData.sections && ballData.sections.length > 0) {
      for (const [sIdx, section] of ballData.sections.entries()) {
        const { data: sectionData, error: sectionError } = await supabase
            .from("ball_sections")
            .insert({
              ball_id: ball.id,
              order_index: sIdx,
              name: section.name,
              name_de: section.name_de,
              name_ru: section.name_ru,
            })
            .select()
            .single()

        if (sectionError) throw sectionError

        // Build a local entries array. Prefer `entries` if provided by the client.
        let entries: any[] = Array.isArray((section as any).entries) ? [...(section as any).entries] : []
        // Only use legacy `dances`/`texts` if no unified `entries` were provided
        if (entries.length === 0 && (((section as any).dances && (section as any).dances.length > 0) || ((section as any).texts && (section as any).texts.length > 0))) {
          const legacyDances = ((section as any).dances || []).map((d: any, i: number) => ({ kind: 'dance', danceId: d.danceId || d.dance_id, musicId: d.musicId ?? d.music_id ?? null, order_index: i }))
          const legacyTexts = ((section as any).texts || []).map((t: any, i: number) => ({ kind: 'text', content: t.content, order_index: ((section as any).dances || []).length + i }))
          entries.push(...legacyDances, ...legacyTexts)
        }

        if (entries && entries.length > 0) {
          // validate unique order_index
          const idxs = entries.map(e => e.order_index)
          const uniqueIdxs = new Set(idxs)
          if (uniqueIdxs.size !== idxs.length) {
            // find duplicate values
            const counts: Record<number, number> = {}
            idxs.forEach((v: number) => { counts[v] = (counts[v] || 0) + 1 })
            const duplicates = Object.keys(counts).filter(k => counts[Number(k)] > 1)
            throw new Error(`Duplicate order_index values in section entries for section ${sIdx}: ${duplicates.join(',')}`)
          }

          // normalize to sorted order by order_index
          const sorted = entries.slice().sort((a, b) => a.order_index - b.order_index)

          // Insert dances and texts separately using provided order_index values
          const dancesToInsert = sorted
              .filter(e => e.kind === 'dance')
              .map((e: any) => ({ section_id: sectionData.id, order_index: e.order_index, dance_id: e.danceId, music_ids: Array.isArray(e.musicIds) ? e.musicIds : [] }))
          if (dancesToInsert.length > 0) {
            const { error: dancesError } = await supabase.from('section_dances').insert(dancesToInsert)
            if (dancesError) throw dancesError
          }

          // Insert texts with localized fields
          const textsToInsert = sorted
              .filter(e => e.kind === 'text')
              .map((e: any) => ({
                section_id: sectionData.id,
                order_index: e.order_index,
                content_de: (e.content_de ?? e.content ?? '').trim(),
                content_ru: (e.content_ru ?? e.content ?? '').trim(),
              }))
          if (textsToInsert.length > 0) {
            const { error: textsError } = await supabase.from('section_texts').insert(textsToInsert)
            if (textsError) throw textsError
          }
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

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

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

    // Fetch existing sections to cascade delete their dances and texts
    const { data: existingSections, error: fetchSectionsError } = await supabase
        .from("ball_sections")
        .select("id")
        .eq("ball_id", id)
    if (fetchSectionsError) throw fetchSectionsError

    const sectionIds = (existingSections || []).map(s => s.id)

    if (sectionIds.length > 0) {
      const { error: delTextsError } = await supabase
          .from("section_texts")
          .delete()
          .in("section_id", sectionIds)
      if (delTextsError) throw delTextsError

      const { error: delDancesError } = await supabase
          .from("section_dances")
          .delete()
          .in("section_id", sectionIds)
      if (delDancesError) throw delDancesError
    }

    const { error: deleteSectionsError } = await supabase
        .from("ball_sections")
        .delete()
        .eq("ball_id", id)
    if (deleteSectionsError) throw deleteSectionsError

    // Recreate sections with dances and texts
    for (const [sIdx, section] of ballData.sections.entries()) {
      const { data: sectionData, error: sectionError } = await supabase
          .from("ball_sections")
          .insert({
            ball_id: id,
            order_index: sIdx,
            name: section.name,
            name_de: section.name_de,
            name_ru: section.name_ru,
          })
          .select()
          .single()
      if (sectionError) throw sectionError

      // Build entries local copy, prefer unified `entries` if provided
      let entries: any[] = Array.isArray((section as any).entries) ? [...(section as any).entries] : []
      if (entries.length === 0 && (((section as any).dances && (section as any).dances.length > 0) || ((section as any).texts && (section as any).texts.length > 0))) {
        const legacyDances = ((section as any).dances || []).map((d: any, i: number) => ({ kind: 'dance', danceId: d.danceId || d.dance_id, musicId: d.musicId ?? d.music_id ?? null, order_index: i }))
        const legacyTexts = ((section as any).texts || []).map((t: any, i: number) => ({ kind: 'text', content: t.content, order_index: ((section as any).dances || []).length + i }))
        entries.push(...legacyDances, ...legacyTexts)
      }

      if (entries && entries.length > 0) {
        const idxs = entries.map(e => e.order_index)
        const uniqueIdxs = new Set(idxs)
        if (uniqueIdxs.size !== idxs.length) {
          const counts: Record<number, number> = {}
          idxs.forEach((v: number) => { counts[v] = (counts[v] || 0) + 1 })
          const duplicates = Object.keys(counts).filter(k => counts[Number(k)] > 1)
          throw new Error(`Duplicate order_index values in section entries for section ${sIdx}: ${duplicates.join(',')}`)
        }

        const sorted = entries.slice().sort((a, b) => a.order_index - b.order_index)

        const dancesToInsert = sorted
            .filter(e => e.kind === 'dance')
            .map((e: any) => ({ section_id: sectionData.id, order_index: e.order_index, dance_id: e.danceId, music_ids: Array.isArray(e.musicIds) ? e.musicIds : [] }))
        if (dancesToInsert.length > 0) {
          const { error: dancesError } = await supabase.from('section_dances').insert(dancesToInsert)
          if (dancesError) throw dancesError
        }

        // Insert texts with localized fields
        const textsToInsert = sorted
            .filter(e => e.kind === 'text')
            .map((e: any) => ({
              section_id: sectionData.id,
              order_index: e.order_index,
              content_de: (e.content_de ?? e.content ?? '').trim(),
              content_ru: (e.content_ru ?? e.content ?? '').trim(),
            }))
        if (textsToInsert.length > 0) {
          const { error: textsError } = await supabase.from('section_texts').insert(textsToInsert)
          if (textsError) throw textsError
        }
      }
    }

    revalidatePath("/balls")
    revalidatePath(`/balls/${id}`)
  } catch (error) {
    console.log("[v0] Update ball error:", error)
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

    const dancesWithMusic = (data || []).map((dance: any) => ({
      ...dance,
      musicTracks:
          dance.dance_music?.map((dm: any) => dm.music).filter((m: any) => m && m.audio_url) || []
    }))

    return dancesWithMusic
  } catch (error) {
    console.log("[v0] Dances fetch exception:", error)
    return []
  }
}

export async function deleteBall(id: string) {
  try {
    const supabase = await createClient()

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

// File: `app/actions/ball.ts`
export async function updateBallInfo(id: string, info_de?: string, info_ru?: string) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const payload: Record<string, any> = {}
    if (typeof info_de !== "undefined") payload.info_de = (info_de ?? "").trim()
    if (typeof info_ru !== "undefined") payload.info_ru = (info_ru ?? "").trim()

    if (Object.keys(payload).length === 0) {
      throw new Error("No info provided to update")
    }

    const { error } = await supabase
        .from("balls")
        .update(payload)
        .eq("id", id)

    if (error) throw error

    revalidatePath(`/balls/${id}/info`)
    revalidatePath(`/balls/${id}`)
  } catch (error) {
    console.log("[v0] Update ball info error:", error)
    throw error
  }
}


// End of file
