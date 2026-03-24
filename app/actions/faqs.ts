"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface FaqItem {
  question_ua: string
  question_ru: string
  answer_ua: string
  answer_ru: string
  order_index: number
}

export async function getFAQs() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("order_index", { ascending: true })

    if (error) throw error
    return data ?? []
  } catch (error) {
    console.error("[faqs] Fetch error:", error)
    return []
  }
}

export async function saveFAQs(faqs: FaqItem[]) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Delete all existing FAQs
    const { error: deleteError } = await supabase
      .from("faqs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // delete all rows

    if (deleteError) throw deleteError

    // Insert new FAQs
    if (faqs.length > 0) {
      const { error: insertError } = await supabase
        .from("faqs")
        .insert(faqs.map((faq, idx) => ({
          question_ua: faq.question_ua,
          question_ru: faq.question_ru,
          answer_ua: faq.answer_ua,
          answer_ru: faq.answer_ru,
          order_index: idx,
        })))

      if (insertError) throw insertError
    }

    revalidatePath("/faq")
  } catch (error) {
    console.error("[faqs] Save error:", error)
    throw error
  }
}
