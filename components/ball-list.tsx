"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { formatDate } from "@/lib/date-utils"

interface Ball {
  id: string
  name: string
  name_de: string | null
  name_ru: string | null
  date: string
  place: string | null
  place_de: string | null
  place_ru: string | null
  ball_dances?: Array<{
    dances: {
      id: string
      name: string
    } | null
  }>
}

interface BallListProps {
  balls: Ball[]
  query?: string
}

export function BallList({ balls, query }: BallListProps) {
  const { t, language } = useLanguage()

  const getCityDisplay = (ball: Ball) => {
    if (language === "ru") {
      return ball.place_ru || ball.place || ""
    } else {
      return ball.place_de || ball.place || ""
    }
  }

  // Filter by search query
  const filteredBalls = balls.filter((ball) => {
    const displayName = language === "ru" 
      ? (ball.name_ru || ball.name)
      : (ball.name_de || ball.name)
    
    if (!query) return true
    return displayName.toLowerCase().includes(query.toLowerCase())
  })

  if (filteredBalls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">
          {query ? `${t("noBallsFound")} "${query}"` : t("noBallsFound")}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filteredBalls.map((ball) => {
        const displayName = language === "ru" 
          ? (ball.name_ru || ball.name)
          : (ball.name_de || ball.name)
        
        const displayPlace = getCityDisplay(ball)
        const formattedDate = formatDate(ball.date, language)

        return (
          <Link key={ball.id} href={`/balls/${ball.id}`}>
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-foreground">{displayName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    {formattedDate}
                  </p>
                  <p className="text-muted-foreground">
                    {t("ballPlace")}: {displayPlace}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
