"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let refreshTimer: NodeJS.Timeout | null = null
    
    const supabase = createClient()
    
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (mounted) {
          setUser(user)
          setLoading(false)
        }
      } catch (error) {
        if (mounted) {
          console.error("[v0] Failed to get user:", error)
          setLoading(false)
        }
      }
    }
    
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      if (refreshTimer) clearTimeout(refreshTimer)
      subscription.unsubscribe()
    }
  }, [])

  const isAdmin = !!user?.user_metadata?.is_admin

  return { user, loading, isAuthenticated: !!user, isAdmin }
}
