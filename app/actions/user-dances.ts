'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

interface DanceWithStatus {
  id: string
  name: string
  name_ua: string | null
  name_ru: string | null
  description: string | null
  description_ua: string | null
  description_ru: string | null
  difficulty: string | null
  origin: string | null
  is_favorite: boolean
  list_type: string | null
}

export async function getUserDancesWithStatus(): Promise<DanceWithStatus[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const adminClient = await createServiceClient()

  const { data: statuses, error: statusError } = await adminClient
    .from('user_dance_status')
    .select('dance_id, is_favorite, list_type')
    .eq('user_id', user.id)
    .or('is_favorite.eq.true,list_type.not.is.null')

  if (statusError || !statuses || statuses.length === 0) return []

  const danceIds = statuses.map(s => s.dance_id)

  const { data: dances, error: dancesError } = await adminClient
    .from('dances')
    .select('id, name, name_ua, name_ru, description, description_ua, description_ru, difficulty, origin')
    .in('id', danceIds)
    .order('name')

  if (dancesError || !dances) return []

  const statusMap = new Map(statuses.map(s => [s.dance_id, s]))

  return dances.map(dance => {
    const status = statusMap.get(dance.id)
    return {
      ...dance,
      is_favorite: status?.is_favorite ?? false,
      list_type: status?.list_type ?? null,
    }
  })
}
