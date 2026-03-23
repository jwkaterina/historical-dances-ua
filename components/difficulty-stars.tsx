"use client"

import { Star } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

const DIFFICULTY_LEVELS: Record<string, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
}

interface DifficultyStarsProps {
  difficulty: string
  size?: "sm" | "default"
}

export function DifficultyStars({ difficulty, size = "sm" }: DifficultyStarsProps) {
  const { t } = useLanguage()
  const level = DIFFICULTY_LEVELS[difficulty] ?? 0
  if (level === 0) return null

  const difficultyMap: Record<string, string> = {
    Beginner: t("beginner"),
    Intermediate: t("intermediate"),
    Advanced: t("advanced"),
    Expert: t("expert"),
  }
  const label = difficultyMap[difficulty] || difficulty

  const starSize = size === "sm" ? "h-3 w-3" : "h-4 w-4"

  return (
    <span className="inline-flex items-center gap-0.5" title={label}>
      {Array.from({ length: 4 }, (_, i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i < level
              ? "fill-primary text-primary"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </span>
  )
}
