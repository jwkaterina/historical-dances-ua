"use client"

import { useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { DanceList } from "@/components/dance-list"
import { CreateDanceForm } from "@/components/create-dance-form"
import { SearchInput } from "@/components/search-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Suspense } from "react"

interface Dance {
  id: string
  name: string
  name_de: string | null
  name_ru: string | null
  description: string | null
  description_de: string | null
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

  // Transform dances to show localized names
  const localizedDances = dances.map((dance) => ({
    ...dance,
    displayName: language === "ru" ? (dance.name_ru || dance.name) : (dance.name_de || dance.name),
    displayDescription: language === "ru" 
      ? (dance.description_ru || dance.description) 
      : (dance.description_de || dance.description),
  }))

  // Filter by difficulty
  const filteredDances = selectedDifficulty === "all" 
    ? localizedDances 
    : localizedDances.filter(dance => dance.difficulty === selectedDifficulty)

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("dancesTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("dancesDescription")}</p>
        </div>
        <CreateDanceForm />
      </div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <Suspense fallback={null}>
            <SearchInput placeholder={t("searchDances")} />
          </Suspense>
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger>
              <SelectValue placeholder={t("filterByDifficulty")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allDifficulties")}</SelectItem>
              <SelectItem value="Beginner">{t("beginner")}</SelectItem>
              <SelectItem value="Intermediate">{t("intermediate")}</SelectItem>
              <SelectItem value="Advanced">{t("advanced")}</SelectItem>
              <SelectItem value="Expert">{t("expert")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DanceList dances={filteredDances} query={query} />
    </>
  )
}
