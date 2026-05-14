"use client"

import { useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { useUserDanceStatus } from "@/components/user-dance-status-provider"
import { DanceList } from "@/components/dance-list"
import { CreateDanceForm } from "@/components/create-dance-form"
import { SearchInput } from "@/components/search-input"
import { DifficultyStars } from "@/components/difficulty-stars"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Heart, GraduationCap, BookMarked, Lightbulb } from "lucide-react"
import { Suspense } from "react"
import { useAuth } from "@/hooks/use-auth"

type UserFilter = "all" | "favorites" | "already_learned" | "learning" | "plan_to_learn"

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
}

interface HomeContentProps {
  dances: Dance[]
  query?: string
}

export function HomeContent({ dances, query }: HomeContentProps) {
  const { t, language } = useLanguage()
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [userFilter, setUserFilter] = useState<UserFilter>("all")
  const { isAdmin, isAuthenticated } = useAuth()
  const { statuses } = useUserDanceStatus()

  // Transform dances to show localized names
  const localizedDances = dances.map((dance) => ({
    ...dance,
    displayName: language === "ru" ? (dance.name_ru || dance.name) : (dance.name_ua || dance.name),
    displayDescription: language === "ru"
      ? (dance.description_ru || dance.description)
      : (dance.description_ua || dance.description),
  }))

  // Filter by difficulty
  const difficultyFiltered = selectedDifficulty === "all"
    ? localizedDances
    : localizedDances.filter(dance => dance.difficulty === selectedDifficulty)

  // Filter by user status
  const filteredDances = userFilter === "all" ? difficultyFiltered : difficultyFiltered.filter(dance => {
    const status = statuses.get(dance.id)
    if (userFilter === "favorites") return status?.is_favorite === true
    return status?.list_type === userFilter
  })

  return (
    <>
      <div className={`grid transition-all duration-300 ease-in-out ${isAdmin ? "grid-rows-[1fr] opacity-100 mb-4" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden flex justify-end">
          <CreateDanceForm />
        </div>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t("dancesTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("dancesDescription")}</p>
      </div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <Suspense fallback={null}>
            <SearchInput placeholder={t("searchDances")} />
          </Suspense>
        </div>
        <div className="flex items-center gap-2 self-end">
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder={t("filterByDifficulty")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allDifficulties")}</SelectItem>
              <SelectItem value="Beginner"><span className="flex items-center gap-2"><DifficultyStars difficulty="Beginner" />{t("beginner")}</span></SelectItem>
              <SelectItem value="Intermediate"><span className="flex items-center gap-2"><DifficultyStars difficulty="Intermediate" />{t("intermediate")}</span></SelectItem>
              <SelectItem value="Advanced"><span className="flex items-center gap-2"><DifficultyStars difficulty="Advanced" />{t("advanced")}</span></SelectItem>
              <SelectItem value="Expert"><span className="flex items-center gap-2"><DifficultyStars difficulty="Expert" />{t("expert")}</span></SelectItem>
            </SelectContent>
          </Select>
          {isAuthenticated && (
            <Select value={userFilter} onValueChange={(v) => setUserFilter(v as UserFilter)}>
              <SelectTrigger>
                <SelectValue placeholder={t("filterByList")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allMyDances")}</SelectItem>
                <SelectItem value="favorites"><span className="flex items-center gap-2"><Heart className="h-4 w-4" />{t("favorites")}</span></SelectItem>
                <SelectItem value="learning"><span className="flex items-center gap-2"><Lightbulb className="h-4 w-4" />{t("learning")}</span></SelectItem>
                <SelectItem value="already_learned"><span className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />{t("alreadyLearned")}</span></SelectItem>
                <SelectItem value="plan_to_learn"><span className="flex items-center gap-2"><BookMarked className="h-4 w-4" />{t("planToLearn")}</span></SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      <DanceList dances={filteredDances} query={query} />
    </>
  )
}
