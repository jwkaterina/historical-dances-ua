'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface UpdateDanceData {
  id: string
  name: string
  name_ua: string | null
  name_ru: string | null
  description: string | null
  description_ua: string | null
  description_ru: string | null
  scheme: string | null
  scheme_ua: string | null
  scheme_ru: string | null
  difficulty: string | null
  origin: string | null
}

interface MusicEntry {
  id?: string
  title: string
  artist: string
  tempo: string
  genre: string
  audio_url?: string
}

interface VideoEntry {
  id?: string
  video_type: 'youtube' | 'uploaded'
  url: string
}

interface FigureVideoEntry {
  id?: string
  video_type: 'youtube' | 'uploaded'
  url: string
}

interface FigureEntry {
  id?: string
  scheme_ua: string | null
  scheme_ru: string | null
  videos: FigureVideoEntry[]
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

export async function updateDance(danceData: UpdateDanceData, musicEntries: MusicEntry[], videoEntries: VideoEntry[], figureEntries: FigureEntry[] = [], tutorialIds: string[] = []) {
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
          name_ua: danceData.name_ua,
          name_ru: danceData.name_ru,
          description: danceData.description,
          description_ua: danceData.description_ua,
          description_ru: danceData.description_ru,
          scheme: danceData.scheme,
          scheme_ua: danceData.scheme_ua,
          scheme_ru: danceData.scheme_ru,
          difficulty: danceData.difficulty,
          origin: danceData.origin,
        })
        .eq('id', danceData.id)

      if (danceError) {
        console.error('[v0] Dance update error:', danceError)
        throw new Error(`Failed to update dance: ${danceError.message}`)
      }

      console.log('[v0] Dance updated successfully on server for ID:', danceData.id)
    })

    // Sync dance videos
    console.log('[v0] Syncing dance videos for ID:', danceData.id)
    await withRetry(async () => {
      // Fetch existing video entries
      const { data: existingVideos, error: fetchVideosError } = await supabase
        .from('dance_videos')
        .select('id')
        .eq('dance_id', danceData.id)

      if (fetchVideosError) {
        console.error('[v0] Fetch current videos error:', fetchVideosError)
        throw new Error(`Failed to fetch current videos: ${fetchVideosError.message}`)
      }

      const existingVideoIds = new Set<string>((existingVideos || []).map((v: any) => v.id))
      const submittedVideoIds = new Set<string>(videoEntries.map(v => v.id).filter(Boolean) as string[])

      // Delete videos that are not in the submitted set
      const toDelete = Array.from(existingVideoIds).filter(id => !submittedVideoIds.has(id))
      if (toDelete.length > 0) {
        const { error: deleteVideoError } = await supabase
          .from('dance_videos')
          .delete()
          .in('id', toDelete)
        if (deleteVideoError) {
          console.error('[v0] Delete obsolete videos error:', deleteVideoError)
          throw new Error(`Failed to delete obsolete videos: ${deleteVideoError.message}`)
        }
        console.log('[v0] Deleted', toDelete.length, 'obsolete dance videos')
      }
    })

    // Update or insert video entries
    for (let i = 0; i < videoEntries.length; i++) {
      const video = videoEntries[i]
      await withRetry(async () => {
        if (video.id) {
          // Update existing video
          const { error: updateError } = await supabase
            .from('dance_videos')
            .update({
              video_type: video.video_type,
              url: video.url,
              order_index: i,
            })
            .eq('id', video.id)
          if (updateError) {
            console.error('[v0] Update video error:', updateError)
            throw new Error(`Failed to update video: ${updateError.message}`)
          }
          console.log('[v0] Updated video ID:', video.id)
        } else {
          // Insert new video
          const { error: insertError } = await supabase
            .from('dance_videos')
            .insert({
              dance_id: danceData.id,
              video_type: video.video_type,
              url: video.url,
              order_index: i,
            })
          if (insertError) {
            console.error('[v0] Insert video error:', insertError)
            throw new Error(`Failed to insert video: ${insertError.message}`)
          }
          console.log('[v0] Inserted new video')
        }
      })
    }

    // Sync dance figures
    console.log('[v0] Syncing dance figures for ID:', danceData.id)
    await withRetry(async () => {
      // Fetch existing figures
      const { data: existingFigures, error: fetchFiguresError } = await supabase
        .from('dance_figures')
        .select('id')
        .eq('dance_id', danceData.id)

      if (fetchFiguresError) {
        console.error('[v0] Fetch current figures error:', fetchFiguresError)
        throw new Error(`Failed to fetch current figures: ${fetchFiguresError.message}`)
      }

      const existingFigureIds = new Set<string>((existingFigures || []).map((f: any) => f.id))
      const submittedFigureIds = new Set<string>(figureEntries.map(f => f.id).filter(Boolean) as string[])

      // Delete figures that are not in the submitted set (CASCADE will delete their videos)
      const toDelete = Array.from(existingFigureIds).filter(id => !submittedFigureIds.has(id))
      if (toDelete.length > 0) {
        const { error: deleteFigureError } = await supabase
          .from('dance_figures')
          .delete()
          .in('id', toDelete)
        if (deleteFigureError) {
          console.error('[v0] Delete obsolete figures error:', deleteFigureError)
          throw new Error(`Failed to delete obsolete figures: ${deleteFigureError.message}`)
        }
        console.log('[v0] Deleted', toDelete.length, 'obsolete dance figures')
      }
    })

    // Update or insert figure entries
    for (let i = 0; i < figureEntries.length; i++) {
      const figure = figureEntries[i]
      let figureId = figure.id

      await withRetry(async () => {
        if (figureId) {
          // Update existing figure
          const { error: updateError } = await supabase
            .from('dance_figures')
            .update({
              scheme_ua: figure.scheme_ua,
              scheme_ru: figure.scheme_ru,
              order_index: i,
            })
            .eq('id', figureId)
          if (updateError) {
            console.error('[v0] Update figure error:', updateError)
            throw new Error(`Failed to update figure: ${updateError.message}`)
          }
          console.log('[v0] Updated figure ID:', figureId)
        } else {
          // Insert new figure
          const { data: newFigure, error: insertError } = await supabase
            .from('dance_figures')
            .insert({
              dance_id: danceData.id,
              scheme_ua: figure.scheme_ua,
              scheme_ru: figure.scheme_ru,
              order_index: i,
            })
            .select()
            .single()
          if (insertError) {
            console.error('[v0] Insert figure error:', insertError)
            throw new Error(`Failed to insert figure: ${insertError.message}`)
          }
          figureId = newFigure.id
          console.log('[v0] Inserted new figure with ID:', figureId)
        }
      })

      // Sync figure videos
      if (figureId) {
        await withRetry(async () => {
          // Fetch existing videos for this figure
          const { data: existingVideos, error: fetchVideosError } = await supabase
            .from('figure_videos')
            .select('id')
            .eq('figure_id', figureId)

          if (fetchVideosError) {
            console.error('[v0] Fetch figure videos error:', fetchVideosError)
            throw new Error(`Failed to fetch figure videos: ${fetchVideosError.message}`)
          }

          const existingVideoIds = new Set<string>((existingVideos || []).map((v: any) => v.id))
          const submittedVideoIds = new Set<string>(figure.videos.map(v => v.id).filter(Boolean) as string[])

          // Delete videos that are not in the submitted set
          const toDeleteVideos = Array.from(existingVideoIds).filter(id => !submittedVideoIds.has(id))
          if (toDeleteVideos.length > 0) {
            const { error: deleteVideoError } = await supabase
              .from('figure_videos')
              .delete()
              .in('id', toDeleteVideos)
            if (deleteVideoError) {
              console.error('[v0] Delete obsolete figure videos error:', deleteVideoError)
              throw new Error(`Failed to delete obsolete figure videos: ${deleteVideoError.message}`)
            }
            console.log('[v0] Deleted', toDeleteVideos.length, 'obsolete figure videos')
          }
        })

        // Update or insert figure video entries
        for (let j = 0; j < figure.videos.length; j++) {
          const video = figure.videos[j]
          await withRetry(async () => {
            if (video.id) {
              // Update existing video
              const { error: updateError } = await supabase
                .from('figure_videos')
                .update({
                  video_type: video.video_type,
                  url: video.url,
                  order_index: j,
                })
                .eq('id', video.id)
              if (updateError) {
                console.error('[v0] Update figure video error:', updateError)
                throw new Error(`Failed to update figure video: ${updateError.message}`)
              }
              console.log('[v0] Updated figure video ID:', video.id)
            } else {
              // Insert new video
              const { error: insertError } = await supabase
                .from('figure_videos')
                .insert({
                  figure_id: figureId,
                  video_type: video.video_type,
                  url: video.url,
                  order_index: j,
                })
              if (insertError) {
                console.error('[v0] Insert figure video error:', insertError)
                throw new Error(`Failed to insert figure video: ${insertError.message}`)
              }
              console.log('[v0] Inserted new figure video')
            }
          })
        }
      }
    }

    // Handle music entries - only save tracks that have audio files
    const validMusic = musicEntries.filter((m) => m.audio_url && m.audio_url.trim() !== '')
    console.log('[v0] Processing', validMusic.length, 'valid music entries with audio')

    // Sync dance_music links to submitted validMusic without wholesale deletion
    console.log('[v0] Syncing dance_music links for ID:', danceData.id)
    await withRetry(async () => {
      const { data: existingLinks, error: fetchLinksError } = await supabase
        .from('dance_music')
        .select('music_id')
        .eq('dance_id', danceData.id)

      if (fetchLinksError) {
        console.error('[v0] Fetch current links error:', fetchLinksError)
        throw new Error(`Failed to fetch current music links: ${fetchLinksError.message}`)
      }

      const currentIds = new Set<string>((existingLinks || []).map((l: any) => l.music_id))
      const targetIds = new Set<string>(validMusic.map(m => m.id!).filter(Boolean))

      // Delete links that are not in the target set
      const toDelete = Array.from(currentIds).filter(id => !targetIds.has(id))
      if (toDelete.length > 0) {
        const { error: deleteLinkError } = await supabase
          .from('dance_music')
          .delete()
          .eq('dance_id', danceData.id)
          .in('music_id', toDelete)
        if (deleteLinkError) {
          console.error('[v0] Delete obsolete links error:', deleteLinkError)
          throw new Error(`Failed to delete obsolete links: ${deleteLinkError.message}`)
        }
        console.log('[v0] Deleted', toDelete.length, 'obsolete dance_music links')
      }
    })

    // Handle music entries - only save tracks that have audio files
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

    // Sync dance_tutorials
    await withRetry(async () => {
      await supabase.from('dance_tutorials').delete().eq('dance_id', danceData.id)
      if (tutorialIds.length > 0) {
        const { error: tutorialError } = await supabase.from('dance_tutorials').insert(
          tutorialIds.map(tid => ({ dance_id: danceData.id, tutorial_id: tid }))
        )
        if (tutorialError) throw new Error(`Failed to sync tutorials: ${tutorialError.message}`)
      }
    })

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

    // 1) Check if dance is present in any ball via section_dances
    console.log('[v0] Checking ball references for dance ID:', danceId)
    const { data: sectionsWithBalls, error: refError } = await supabase
      .from('ball_sections')
      .select('id, ball_id, balls:ball_id ( id, name, name_ua, name_ru ) , section_dances!inner ( dance_id )')
      .eq('section_dances.dance_id', danceId)

    if (refError) {
      console.error('[v0] Error checking ball references:', refError)
      throw new Error(`Failed to check ball references: ${refError.message}`)
    }

    const referencedBalls = Array.from(
      new Map(
        (sectionsWithBalls || [])
          .map((s: any) => s.balls)
          .filter((b: any) => b && b.id)
          .map((b: any) => [b.id, b])
      ).values()
    )

    if (referencedBalls.length > 0) {
      const ballNames = referencedBalls.map((b: any) => b.name).filter(Boolean)
      // Return a friendly structured response; client can toast this without causing a 500
      return {
        success: false,
        code: 'DANCE_IN_BALLS',
        message: `This dance is used in ${ballNames.length > 1 ? 'balls' : 'a ball'}: ${ballNames.join(', ')}. Remove it from those first.`,
        balls: referencedBalls,
      }
    }

    // 2) Collect music IDs linked to this dance before deleting links
    console.log('[v0] Gathering associated music IDs for dance:', danceId)
    const { data: linkedMusic, error: dmFetchError } = await supabase
      .from('dance_music')
      .select('music_id')
      .eq('dance_id', danceId)

    if (dmFetchError) {
      console.error('[v0] Error fetching dance_music:', dmFetchError)
      throw new Error(`Failed to fetch dance music: ${dmFetchError.message}`)
    }
    const associatedMusicIds = Array.from(new Set((linkedMusic || []).map((l: any) => l.music_id)))

    // 3) Delete dance_music links first (cascade)
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

    // 4) Delete the dance
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

    // 5) Safely delete associated music: only those not referenced by other dances or ball sections
    if (associatedMusicIds.length > 0) {
      console.log('[v0] Checking for safe music deletions:', associatedMusicIds.length)

      // Check references in other dances
      const { data: remainingDM, error: remainingDMError } = await supabase
        .from('dance_music')
        .select('music_id')
        .in('music_id', associatedMusicIds)

      if (remainingDMError) {
        console.warn('[v0] Warning: could not check remaining dance_music references:', remainingDMError)
      }

      // Check references in ball sections
      const { data: sectionRefs, error: sectionRefsError } = await supabase
        .from('section_dances')
        .select('music_id')
        .in('music_id', associatedMusicIds)

      if (sectionRefsError) {
        console.warn('[v0] Warning: could not check section_dances references:', sectionRefsError)
      }

      const dmReferenced = new Set<string>((remainingDM || []).map((r: any) => r.music_id).filter(Boolean))
      const sdReferenced = new Set<string>((sectionRefs || []).map((r: any) => r.music_id).filter(Boolean))

      const safeToDelete = associatedMusicIds.filter((id) => !dmReferenced.has(id) && !sdReferenced.has(id))

      if (safeToDelete.length > 0) {
        console.log('[v0] Deleting', safeToDelete.length, 'unreferenced music records')
        const { error: musicDeleteError } = await supabase
          .from('music')
          .delete()
          .in('id', safeToDelete)

        if (musicDeleteError) {
          console.warn('[v0] Warning: failed to delete some music rows:', musicDeleteError)
        }
      }
    }

    console.log('[v0] Dance deleted successfully (with safe music cleanup)')

    // Revalidate relevant pages
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('[v0] Delete dance error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(errorMessage)
  }
}
