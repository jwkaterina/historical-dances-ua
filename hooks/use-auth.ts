"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    const fetchRole = (userId: string) => {
      supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .single()
        .then(({ data, error }) => {
          if (error) console.error("[auth] fetchRole error:", error.code, error.message)
          if (mounted) {
            setRole(data?.role ?? null)
            setLoading(false)
          }
        })
    }

    // onAuthStateChange fires immediately with INITIAL_SESSION — no need for separate getUser()
    // Keep handler synchronous to not block Supabase's auth state machine
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        fetchRole(u.id)
      } else {
        setRole(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { user, loading, isAuthenticated: !!user, isAdmin: role === "admin", role }
}
