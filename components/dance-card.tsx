"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FavoriteButton } from "@/components/favorite-button"
import { DanceListSelector } from "@/components/dance-list-selector"
import { useLanguage } from "@/components/language-provider"

interface DanceCardProps {
  dance: {
    id: string
    name: string
    displayName?: string
    description: string | null
    displayDescription?: string | null
    difficulty: string | null
    origin: string | null
  }
}

export function DanceCard({ dance }: DanceCardProps) {
  const { t } = useLanguage()
  const displayName = dance.displayName || dance.name
  const displayDescription = dance.displayDescription || dance.description

  // Translate difficulty level
  const getDifficultyLabel = (difficulty: string | null) => {
    if (!difficulty) return null
    const difficultyMap: Record<string, string> = {
      "Beginner": t("beginner"),
      "Intermediate": t("intermediate"),
      "Advanced": t("advanced"),
      "Expert": t("expert"),
    }
    return difficultyMap[difficulty] || difficulty
  }

  return (
    <Link href={`/dance/${dance.id}`}>
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg text-foreground">{displayName}</CardTitle>
            <div className="flex items-center gap-1 shrink-0">
              {dance.difficulty && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {getDifficultyLabel(dance.difficulty)}
                </Badge>
              )}
              <FavoriteButton danceId={dance.id} />
              <DanceListSelector danceId={dance.id} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {displayDescription}
            </p>
          )}
          {dance.origin && (
            <p className="text-xs text-muted-foreground">
              {t("origin")}: {dance.origin}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
