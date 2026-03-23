"use client"

import { useEffect, useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { useUserDanceStatus } from "@/components/user-dance-status-provider"
import { DanceCard } from "@/components/dance-card"
import { getUserDancesWithStatus } from "@/app/actions/user-dances"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BookOpen, Heart, GraduationCap, BookMarked, Lightbulb } from "lucide-react"
import Link from "next/link"

type Filter = "all" | "favorites" | "already_learned" | "learning" | "plan_to_learn"

interface Dance {
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

export function MyDancesContent() {
  const { t, language } = useLanguage()
  const { isAuthenticated, loading: authLoading, statuses } = useUserDanceStatus()
  const [dances, setDances] = useState<Dance[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    const fetchDances = async () => {
      try {
        const data = await getUserDancesWithStatus()
        setDances(data)
      } catch (error) {
        console.error("[my-dances] Failed to fetch dances:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDances()
  }, [authLoading, isAuthenticated])

  // Keep dance data in sync with provider's optimistic updates
  const syncedDances = dances.map(dance => {
    const providerStatus = statuses.get(dance.id)
    if (providerStatus) {
      return {
        ...dance,
        is_favorite: providerStatus.is_favorite,
        list_type: providerStatus.list_type,
      }
    }
    return dance
  })

  const filteredDances = syncedDances.filter(dance => {
    switch (filter) {
      case "favorites":
        return dance.is_favorite
      case "already_learned":
      case "learning":
      case "plan_to_learn":
        return dance.list_type === filter
      default:
        return true
    }
  })

  const localizedDances = filteredDances.map(dance => ({
    ...dance,
    displayName: language === "ru" ? (dance.name_ru || dance.name) : (dance.name_ua || dance.name),
    displayDescription: language === "ru"
      ? (dance.description_ru || dance.description)
      : (dance.description_ua || dance.description),
  }))

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground mb-2">{t("loginToSeeMyDances")}</p>
        <Link
          href="/auth/login"
          className="text-primary underline hover:text-primary/80 transition-colors"
        >
          {t("login")}
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("myDances")}</h1>
          <p className="mt-2 text-muted-foreground">{t("myDancesDescription")}</p>
        </div>
        <div className="self-end">
          <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <SelectTrigger>
              <SelectValue placeholder={t("filterByList")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allMyDances")}</SelectItem>
              <SelectItem value="favorites"><span className="flex items-center gap-2"><Heart className="h-4 w-4" />{t("favorites")}</span></SelectItem>
              <SelectItem value="already_learned"><span className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />{t("alreadyLearned")}</span></SelectItem>
              <SelectItem value="learning"><span className="flex items-center gap-2"><BookMarked className="h-4 w-4" />{t("learning")}</span></SelectItem>
              <SelectItem value="plan_to_learn"><span className="flex items-center gap-2"><Lightbulb className="h-4 w-4" />{t("planToLearn")}</span></SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {localizedDances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg text-muted-foreground">
            {filter === "all" ? t("noMyDancesYet") : t("noMyDancesInCategory")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("addDancesFromCatalog")}
          </p>
          <Link
            href="/"
            className="mt-4 text-primary underline hover:text-primary/80 transition-colors"
          >
            {t("goToCatalog")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {localizedDances.map(dance => (
            <DanceCard key={dance.id} dance={dance} />
          ))}
        </div>
      )}
    </>
  )
}
