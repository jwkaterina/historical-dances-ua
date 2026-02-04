'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface UpdateDanceData {
  id: string
  name: string
  name_de: string | null
  name_ru: string | null
  description: string | null
  description_de: string | null
  description_ru: string | null
  scheme: string | null
  scheme_de: string | null
  scheme_ru: string | null
  difficulty: string | null
  origin: string | null
  youtube_url: string | null
  video_url: string | null
}

interface MusicEntry {
  id?: string
  title: string
  artist: string
  tempo: string
  genre: string
  audio_url?: string
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: Error | null = null
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[v0] Attempt ${i + 1}/${retries}`)
      return await fn()
    } catch (error) {
      lastError = error as Error
      console.error(`[v0] Attempt ${i + 1} failed:`, lastError.message)
      if (i < retries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 500))
      }
    }
  }
  
  throw lastError
}

export async function updateDance(danceData: UpdateDanceData, musicEntries: MusicEntry[]) {
  try {
    // Verify service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set. Please add it to your Vercel project settings.')
    }

    console.log('[v0] Creating Supabase service client')
    const supabase = await createServiceClient()

    // Update dance with retry
    console.log('[v0] Starting dance update for ID:', danceData.id)
    await withRetry(async () => {
      const { error: danceError } = await supabase
        .from('dances')
        .update({
          name: danceData.name,
          name_de: danceData.name_de,
          name_ru: danceData.name_ru,
          description: danceData.description,
          description_de: danceData.description_de,
          description_ru: danceData.description_ru,
          scheme: danceData.scheme,
          scheme_de: danceData.scheme_de,
          scheme_ru: danceData.scheme_ru,
          difficulty: danceData.difficulty,
          origin: danceData.origin,
          youtube_url: danceData.youtube_url,
          video_url: danceData.video_url,
        })
        .eq('id', danceData.id)

      if (danceError) {
        console.error('[v0] Dance update error:', danceError)
        throw new Error(`Failed to update dance: ${danceError.message}`)
      }

      console.log('[v0] Dance updated successfully on server for ID:', danceData.id)
    })

    // Delete existing dance_music links with retry
    console.log('[v0] Deleting existing dance_music links for ID:', danceData.id)
    await withRetry(async () => {
      const { error: deleteLinkError } = await supabase
        .from('dance_music')
        .delete()
        .eq('dance_id', danceData.id)

      if (deleteLinkError) {
        console.error('[v0] Delete link error:', deleteLinkError)
        throw new Error(`Failed to delete music links: ${deleteLinkError.message}`)
      }

      console.log('[v0] Dance_music links deleted successfully')
    })

    // Delete orphaned music records (music with no associated dances)
    console.log('[v0] Cleaning up orphaned music records')
    await withRetry(async () => {
      // Get all music IDs that are referenced in dance_music
      const { data: referencedMusic, error: fetchReferencedError } = await supabase
        .from('dance_music')
        .select('music_id')

      if (fetchReferencedError) {
        console.warn('[v0] Warning: Failed to fetch referenced music:', fetchReferencedError)
        return
      }

      // Get all music records
      const { data: allMusic, error: fetchAllError } = await supabase
        .from('music')
        .select('id')

      if (fetchAllError) {
        console.warn('[v0] Warning: Failed to fetch all music:', fetchAllError)
        return
      }

      if (allMusic && referencedMusic) {
        const referencedIds = new Set(referencedMusic.map((m) => m.music_id))
        const orphanedIds = allMusic
          .map((m) => m.id)
          .filter((id) => !referencedIds.has(id))

        if (orphanedIds.length > 0) {
          console.log('[v0] Found', orphanedIds.length, 'orphaned music records to delete')

          const { error: deleteError } = await supabase
            .from('music')
            .delete()
            .in('id', orphanedIds)

          if (deleteError) {
            console.warn('[v0] Warning: Failed to delete orphaned music:', deleteError)
          } else {
            console.log('[v0] Successfully deleted', orphanedIds.length, 'orphaned music records')
          }
        }
      }
    })

    // Handle music entries - only save tracks that have audio files
    const validMusic = musicEntries.filter((m) => m.audio_url && m.audio_url.trim() !== '')
    console.log('[v0] Processing', validMusic.length, 'valid music entries with audio')

    for (const music of validMusic) {
      let musicId = music.id

      if (musicId) {
        // First check if the music actually exists in the database
        const { data: existingMusic } = await supabase
          .from('music')
          .select('id')
          .eq('id', musicId)
          .maybeSingle()

        if (existingMusic) {
          console.log('[v0] Updating existing music ID:', musicId)
          await withRetry(async () => {
            const { error: musicError } = await supabase
              .from('music')
              .update({
                title: music.title,
                artist: music.artist || null,
                tempo: music.tempo ? parseInt(music.tempo) : null,
                genre: music.genre || null,
                audio_url: music.audio_url || null,
              })
              .eq('id', musicId)

            if (musicError) {
              console.error('[v0] Music update error:', musicError)
              throw new Error(`Failed to update music: ${musicError.message}`)
            }
          })
        } else {
          // Music ID was provided but doesn't exist - create new music
          console.log('[v0] Music ID provided but not found, creating new:', music.title)
          musicId = undefined
        }
      }
      
      if (!musicId) {
        console.log('[v0] Creating new music entry:', music.title)
        await withRetry(async () => {
          const { data: musicData, error: musicError } = await supabase
            .from('music')
            .insert({
              title: music.title,
              artist: music.artist || null,
              tempo: music.tempo ? parseInt(music.tempo) : null,
              genre: music.genre || null,
              audio_url: music.audio_url || null,
            })
            .select()
            .single()

          if (musicError) {
            console.error('[v0] Music insert error:', musicError)
            throw new Error(`Failed to create music: ${musicError.message}`)
          }
          musicId = musicData.id
          console.log('[v0] New music created with ID:', musicId)
        })
      }

      // Check if link already exists before inserting
      console.log('[v0] Checking if link exists for dance:', danceData.id, 'music:', musicId)
      await withRetry(async () => {
        const { data: existingLink, error: checkError } = await supabase
          .from('dance_music')
          .select('id')
          .eq('dance_id', danceData.id)
          .eq('music_id', musicId)
          .maybeSingle()

        if (checkError) {
          console.error('[v0] Check link error:', checkError)
          throw new Error(`Failed to check existing link: ${checkError.message}`)
        }

        // Only insert if link doesn't exist
        if (!existingLink) {
          console.log('[v0] Inserting new dance_music link')
          const { error: linkError } = await supabase.from('dance_music').insert({
            dance_id: danceData.id,
            music_id: musicId,
          })

          if (linkError) {
            console.error('[v0] Link insert error:', linkError)
            throw new Error(`Failed to create music link: ${linkError.message}`)
          }
        } else {
          console.log('[v0] Link already exists, skipping insert')
        }
      })
    }

    console.log('[v0] Dance and music updated successfully on server')
    
    // Revalidate the dance detail page
    revalidatePath(`/dance/${danceData.id}`)
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('[v0] Server action error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(errorMessage)
  }
}

export async function deleteDance(danceId: string) {
  try {
    // Verify service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set. Please add it to your Vercel project settings.')
    }

    console.log('[v0] Creating Supabase service client for delete')
    const supabase = await createServiceClient()

    // Delete dance_music links first (cascade)
    console.log('[v0] Deleting dance_music links for dance ID:', danceId)
    await withRetry(async () => {
      const { error: deleteLinksError } = await supabase
        .from('dance_music')
        .delete()
        .eq('dance_id', danceId)

      if (deleteLinksError) {
        console.error('[v0] Error deleting dance_music links:', deleteLinksError)
        throw new Error(`Failed to delete music links: ${deleteLinksError.message}`)
      }
    })

    // Delete the dance
    console.log('[v0] Deleting dance with ID:', danceId)
    await withRetry(async () => {
      const { error: deleteDanceError } = await supabase
        .from('dances')
        .delete()
        .eq('id', danceId)

      if (deleteDanceError) {
        console.error('[v0] Error deleting dance:', deleteDanceError)
        throw new Error(`Failed to delete dance: ${deleteDanceError.message}`)
      }
    })

    console.log('[v0] Dance deleted successfully')
    
    // Revalidate the dance list page
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('[v0] Delete dance error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(errorMessage)
  }
}
