"use client"

import { DanceCard } from "./dance-card"
import { useLanguage } from "@/components/language-provider"

interface Dance {
  id: string
  name: string
  displayName?: string
  description: string | null
  displayDescription?: string | null
  difficulty: string | null
  origin: string | null
}

interface DanceListProps {
  dances: Dance[]
  query?: string
}

export function DanceList({ dances, query }: DanceListProps) {
  const { t } = useLanguage()

  if (dances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">
          {query ? `${t("noDancesForQuery")} "${query}"` : t("noDancesFound")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {query ? t("tryDifferentSearch") : t("addDancesToStart")}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {dances.map((dance) => (
        <DanceCard key={dance.id} dance={dance} />
      ))}
    </div>
  )
}
