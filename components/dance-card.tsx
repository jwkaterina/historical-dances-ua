"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DifficultyStars } from "@/components/difficulty-stars"
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

  return (
    <Link href={`/dance/${dance.id}`}>
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div>
            <div className="flex items-center justify-between">
              {dance.difficulty ? (
                <DifficultyStars difficulty={dance.difficulty} />
              ) : <span />}
              <div className="flex items-center gap-1 shrink-0">
                <FavoriteButton danceId={dance.id} />
                <DanceListSelector danceId={dance.id} />
              </div>
            </div>
            <CardTitle className="text-lg text-foreground mt-1">{displayName}</CardTitle>
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
