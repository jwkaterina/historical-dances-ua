"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/language-provider"
import { BallList } from "@/components/ball-list"
import { CreateBallForm } from "@/components/create-ball-form"
import { SearchInput } from "@/components/search-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Suspense } from "react"

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

interface Dance {
  id: string
  name: string
  name_de: string | null
  name_ru: string | null
  difficulty: string | null
}

interface BallsContentProps {
  balls: Ball[]
  dances: Dance[]
  query?: string
}

export function BallsContent({ balls, dances, query }: BallsContentProps) {
  const { t, language } = useLanguage()
  const [filteredBalls, setFilteredBalls] = useState<Ball[]>(balls)
  const [selectedDate, setSelectedDate] = useState<string>("all")
  const [selectedCity, setSelectedCity] = useState<string>("all")

  // Get unique dates and cities from balls
  const uniqueDates = Array.from(new Set(balls.map(b => b.date))).sort().reverse()
  const uniqueCities = Array.from(new Set(
    balls.map(b => language === "ru" ? b.place_ru : b.place_de).filter(Boolean)
  )) as string[]

  const getCityDisplay = (city: string | null) => {
    return city || ""
  }

  useEffect(() => {
    let filtered = balls

    // Filter by search query
    if (query) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter((ball) => {
        const name = language === "ru" ? (ball.name_ru || ball.name) : (ball.name_de || ball.name)
        return name.toLowerCase().includes(lowerQuery)
      })
    }

    // Filter by date
    if (selectedDate !== "all") {
      filtered = filtered.filter(ball => ball.date === selectedDate)
    }

    // Filter by city
    if (selectedCity !== "all") {
      filtered = filtered.filter(ball => {
        const city = language === "ru" ? ball.place_ru : ball.place_de
        return city === selectedCity
      })
    }


    setFilteredBalls(filtered)
  }, [balls, query, language, selectedDate, selectedCity])

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("ballsTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("ballsDescription")}</p>
        </div>
        <CreateBallForm dances={dances} />
      </div>
      <div className="mb-6 flex flex-col gap-4">
        <Suspense fallback={null}>
          <SearchInput placeholder={t("searchBalls")} />
        </Suspense>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder={t("filterByDate")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allDates")}</SelectItem>
                {uniqueDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {new Date(date).toLocaleDateString(
                      language === "ru" ? "ru-RU" : "de-DE",
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder={t("filterByCity")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCities")}</SelectItem>
                {uniqueCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {getCityDisplay(city)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <BallList balls={filteredBalls} query={query} />
    </>
  )
}
