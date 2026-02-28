'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface TutorialData {
  title_de: string
  title_ru: string
  type: 'video' | 'pdf' | 'image'
  video_type?: 'youtube' | 'uploaded' | null
  url: string
  category_id?: string | null
}

export interface CategoryData {
  name_de: string
  name_ru: string
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

export async function createTutorial(data: TutorialData) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    const supabase = await createServiceClient()

    const { data: tutorial, error } = await withRetry(() =>
      supabase
        .from('tutorials')
        .insert({
          title_de: data.title_de,
          title_ru: data.title_ru,
          type: data.type,
          video_type: data.video_type ?? null,
          url: data.url,
          category_id: data.category_id ?? null,
        })
        .select()
        .single()
    )

    if (error) throw new Error(error.message)

    revalidatePath('/tutorials')
    return { success: true, tutorial }
  } catch (error) {
    console.error('[v0] createTutorial error:', error)
    throw new Error(error instanceof Error ? error.message : 'Unknown error')
  }
}

export async function updateTutorial(id: string, data: TutorialData) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    const supabase = await createServiceClient()

    const { error } = await withRetry(() =>
      supabase
        .from('tutorials')
        .update({
          title_de: data.title_de,
          title_ru: data.title_ru,
          type: data.type,
          video_type: data.video_type ?? null,
          url: data.url,
          category_id: data.category_id ?? null,
        })
        .eq('id', id)
    )

    if (error) throw new Error(error.message)

    revalidatePath('/tutorials')
    return { success: true }
  } catch (error) {
    console.error('[v0] updateTutorial error:', error)
    throw new Error(error instanceof Error ? error.message : 'Unknown error')
  }
}

export async function createCategory(data: CategoryData) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    const supabase = await createServiceClient()

    const { data: category, error } = await withRetry(() =>
      supabase
        .from('tutorial_categories')
        .insert({ name_de: data.name_de, name_ru: data.name_ru })
        .select()
        .single()
    )

    if (error) throw new Error(error.message)

    revalidatePath('/tutorials')
    return { success: true, category }
  } catch (error) {
    console.error('[v0] createCategory error:', error)
    throw new Error(error instanceof Error ? error.message : 'Unknown error')
  }
}

export async function updateCategory(id: string, data: CategoryData) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    const supabase = await createServiceClient()

    const { error } = await withRetry(() =>
      supabase
        .from('tutorial_categories')
        .update({ name_de: data.name_de, name_ru: data.name_ru })
        .eq('id', id)
    )

    if (error) throw new Error(error.message)

    revalidatePath('/tutorials')
    return { success: true }
  } catch (error) {
    console.error('[v0] updateCategory error:', error)
    throw new Error(error instanceof Error ? error.message : 'Unknown error')
  }
}

export async function deleteCategory(id: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    const supabase = await createServiceClient()

    // Nullify category_id on tutorials that use this category
    await withRetry(() =>
      supabase
        .from('tutorials')
        .update({ category_id: null })
        .eq('category_id', id)
    )

    const { error } = await withRetry(() =>
      supabase.from('tutorial_categories').delete().eq('id', id)
    )

    if (error) throw new Error(error.message)

    revalidatePath('/tutorials')
    return { success: true }
  } catch (error) {
    console.error('[v0] deleteCategory error:', error)
    throw new Error(error instanceof Error ? error.message : 'Unknown error')
  }
}

export async function deleteTutorial(id: string) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    const supabase = await createServiceClient()

    const { error } = await withRetry(() =>
      supabase.from('tutorials').delete().eq('id', id)
    )

    if (error) throw new Error(error.message)

    revalidatePath('/tutorials')
    return { success: true }
  } catch (error) {
    console.error('[v0] deleteTutorial error:', error)
    throw new Error(error instanceof Error ? error.message : 'Unknown error')
  }
}
