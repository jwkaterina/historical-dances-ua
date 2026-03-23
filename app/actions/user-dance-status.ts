'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ListType = 'already_learned' | 'learning' | 'plan_to_learn' | null

export interface UserDanceStatus {
  id: string
  user_id: string
  dance_id: string
  is_favorite: boolean
  list_type: ListType
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastError: Error | null = null
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 500))
      }
    }
  }
  throw lastError
}

export async function getUserDanceStatuses(): Promise<UserDanceStatus[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = await createServiceClient()
  const { data, error } = await adminClient
    .from('user_dance_status')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    console.error('[user-dance-status] Failed to fetch statuses:', error)
    return []
  }

  return (data || []) as UserDanceStatus[]
}

export async function toggleFavorite(danceId: string): Promise<{ success: boolean; is_favorite: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const adminClient = await createServiceClient()

  return withRetry(async () => {
    // Check if row exists
    const { data: existing } = await adminClient
      .from('user_dance_status')
      .select('id, is_favorite')
      .eq('user_id', user.id)
      .eq('dance_id', danceId)
      .maybeSingle()

    let newFavorite: boolean

    if (existing) {
      newFavorite = !existing.is_favorite
      const { error } = await adminClient
        .from('user_dance_status')
        .update({ is_favorite: newFavorite, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) throw new Error(`Failed to toggle favorite: ${error.message}`)
    } else {
      newFavorite = true
      const { error } = await adminClient
        .from('user_dance_status')
        .insert({ user_id: user.id, dance_id: danceId, is_favorite: true })
      if (error) throw new Error(`Failed to add favorite: ${error.message}`)
    }

    revalidatePath('/')
    return { success: true, is_favorite: newFavorite }
  })
}

export async function setDanceListType(danceId: string, listType: ListType): Promise<{ success: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const adminClient = await createServiceClient()

  return withRetry(async () => {
    // Check if row exists
    const { data: existing } = await adminClient
      .from('user_dance_status')
      .select('id')
      .eq('user_id', user.id)
      .eq('dance_id', danceId)
      .maybeSingle()

    if (existing) {
      const { error } = await adminClient
        .from('user_dance_status')
        .update({ list_type: listType, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) throw new Error(`Failed to update list type: ${error.message}`)
    } else {
      const { error } = await adminClient
        .from('user_dance_status')
        .insert({ user_id: user.id, dance_id: danceId, list_type: listType })
      if (error) throw new Error(`Failed to set list type: ${error.message}`)
    }

    revalidatePath('/')
    return { success: true }
  })
}
