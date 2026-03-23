"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  getUserDanceStatuses,
  toggleFavorite as toggleFavoriteAction,
  setDanceListType as setDanceListTypeAction,
  type ListType,
  type UserDanceStatus,
} from "@/app/actions/user-dance-status"

interface UserDanceStatusContextValue {
  statuses: Map<string, UserDanceStatus>
  isAuthenticated: boolean
  loading: boolean
  toggleFavorite: (danceId: string) => Promise<void>
  setListType: (danceId: string, listType: ListType) => Promise<void>
}

const UserDanceStatusContext = createContext<UserDanceStatusContextValue>({
  statuses: new Map(),
  isAuthenticated: false,
  loading: true,
  toggleFavorite: async () => {},
  setListType: async () => {},
})

export function useUserDanceStatus() {
  return useContext(UserDanceStatusContext)
}

export function UserDanceStatusProvider({ children }: { children: React.ReactNode }) {
  const [statuses, setStatuses] = useState<Map<string, UserDanceStatus>>(new Map())
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const supabase = createClient()

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!mounted) return

        if (user) {
          setIsAuthenticated(true)
          const data = await getUserDanceStatuses()
          if (mounted) {
            const map = new Map<string, UserDanceStatus>()
            data.forEach(s => map.set(s.dance_id, s))
            setStatuses(map)
          }
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("[user-dance-status] Init error:", error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (event === 'INITIAL_SESSION') return

      if (session?.user) {
        setIsAuthenticated(true)
        const data = await getUserDanceStatuses()
        if (mounted) {
          const map = new Map<string, UserDanceStatus>()
          data.forEach(s => map.set(s.dance_id, s))
          setStatuses(map)
        }
      } else {
        setIsAuthenticated(false)
        setStatuses(new Map())
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const toggleFavorite = useCallback(async (danceId: string) => {
    // Optimistic update
    setStatuses(prev => {
      const next = new Map(prev)
      const existing = next.get(danceId)
      if (existing) {
        next.set(danceId, { ...existing, is_favorite: !existing.is_favorite })
      } else {
        next.set(danceId, {
          id: '',
          user_id: '',
          dance_id: danceId,
          is_favorite: true,
          list_type: null,
        })
      }
      return next
    })

    try {
      const result = await toggleFavoriteAction(danceId)
      // Sync with server result
      setStatuses(prev => {
        const next = new Map(prev)
        const existing = next.get(danceId)
        if (existing) {
          next.set(danceId, { ...existing, is_favorite: result.is_favorite })
        }
        return next
      })
    } catch (error) {
      // Revert optimistic update
      setStatuses(prev => {
        const next = new Map(prev)
        const existing = next.get(danceId)
        if (existing) {
          next.set(danceId, { ...existing, is_favorite: !existing.is_favorite })
        }
        return next
      })
      throw error
    }
  }, [])

  const setListType = useCallback(async (danceId: string, listType: ListType) => {
    const prevStatuses = new Map(statuses)

    // Optimistic update
    setStatuses(prev => {
      const next = new Map(prev)
      const existing = next.get(danceId)
      if (existing) {
        next.set(danceId, { ...existing, list_type: listType })
      } else {
        next.set(danceId, {
          id: '',
          user_id: '',
          dance_id: danceId,
          is_favorite: false,
          list_type: listType,
        })
      }
      return next
    })

    try {
      await setDanceListTypeAction(danceId, listType)
    } catch (error) {
      // Revert optimistic update
      setStatuses(prevStatuses)
      throw error
    }
  }, [statuses])

  return (
    <UserDanceStatusContext.Provider value={{ statuses, isAuthenticated, loading, toggleFavorite, setListType }}>
      {children}
    </UserDanceStatusContext.Provider>
  )
}
