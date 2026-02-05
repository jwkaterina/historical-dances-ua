"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateBallForm } from "@/components/create-ball-form"
import { deleteBall } from "@/app/actions/ball"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { formatDate } from "@/lib/date-utils"
import { cities, type CityKey } from "@/lib/translations"
import { Trash2, ArrowLeft, Edit } from "lucide-react"

interface Dance {
  id: string
  name: string
  name_de: string | null
  name_ru: string | null
  difficulty: string | null
}

interface SectionDance {
  id: string
  dances: Dance | null
  order_index: number
  music_id?: string | null
  music?: {
    id: string
    title: string
    artist: string | null
    audio_url: string | null
  } | null
}

interface Section {
  id: string
  name: string
  name_de: string
  name_ru: string
  order_index: number
  section_dances: SectionDance[]
}

interface BallDetailContentProps {
  ball: {
    id: string
    name: string
    name_de: string | null
    name_ru: string | null
    date: string
    place: string | null
    place_de: string | null
    place_ru: string | null
    ball_sections: Section[]
  }
  allDances: Dance[]
}

export function BallDetailContent({
  ball,
  allDances,
}: BallDetailContentProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { isAdmin } = useAuth()

  const displayName = language === "ru"
    ? (ball.name_ru || ball.name)
    : (ball.name_de || ball.name)

  const getCityDisplay = (cityKey: string | null) => {
    if (!cityKey) return ""
    return language === "ru"
      ? cities.ru[cityKey as CityKey] || cityKey
      : cities.de[cityKey as CityKey] || cityKey
  }

  const displayPlace = getCityDisplay(ball.place)
  const formattedDate = formatDate(ball.date, language)

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

  const getDisplayDanceName = (dance: Dance) => {
    return language === "ru"
      ? (dance.name_ru || dance.name)
      : (dance.name_de || dance.name)
  }

  const getDisplaySectionName = (section: Section, index: number) => {
    return language === "ru" ? `Отделение ${index + 1}` : `Abteilung ${index + 1}`
  }

  const handleDelete = async () => {
    try {
      await deleteBall(ball.id)
      toast({
        title: t("success") || "Success",
        description: t("ballDeleted") || "Ball deleted successfully",
      })
      router.push("/balls")
    } catch (error) {
      console.error("[v0] Delete ball error:", error)
      toast({
        title: t("error") || "Error",
        description: error instanceof Error ? error.message : "Failed to delete ball",
        variant: "destructive",
      })
    }
  }

  const sortedSections = [...ball.ball_sections].sort(
    (a, b) => a.order_index - b.order_index
  )

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
          <div className="mt-4 space-y-2 text-muted-foreground">
            <p>
              <span className="font-semibold">{t("ballDate")}:</span>{" "}
              {formattedDate}
            </p>
            <p>
              <span className="font-semibold">{t("city")}:</span>{" "}
              {displayPlace}
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <CreateBallForm dances={allDances} ballToEdit={ball} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("deleteBall")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteConfirmBall")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("deleteConfirmMessageBall")} "{displayName}"
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex gap-3">
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t("delete")}
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Sections with Dances */}
      {sortedSections.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">{t("noSections")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedSections.map((section, index) => {
            const sortedDances = [...(section.section_dances || [])].sort(
              (a, b) => a.order_index - b.order_index
            )

            return (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-xl">
                    {getDisplaySectionName(section, index)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sortedDances.length === 0 ? (
                    <p className="text-muted-foreground">{t("noDancesSelected")}</p>
                  ) : (
                    <div className="space-y-3">
                      {sortedDances.map((sd, sdIndex) => {
                        if (!sd.dances) return null
                        return (
                          <div
                            key={sd.id}
                            className="pb-3 border-b last:border-0"
                          >
                            <div className="flex items-start gap-4 mb-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">
                                  {sdIndex + 1}
                                </span>
                              </div>
                              <Link
                                href={`/dance/${sd.dances.id}?ballId=${ball.id}`}
                                className="flex-1 transition-colors hover:text-primary"
                              >
                                <div>
                                  <h4 className="font-semibold text-foreground">
                                    {getDisplayDanceName(sd.dances)}
                                  </h4>
                                  {sd.dances.difficulty && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {getDifficultyLabel(sd.dances.difficulty)}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            </div>
                            {sd.music?.audio_url && (
                              <div className="ml-10 mt-2">
                                <audio
                                  controls
                                  className="w-full"
                                  controlsList="nodownload"
                                  crossOrigin="anonymous"
                                  src={sd.music.audio_url}
                                  style={{ minHeight: '32px' }}
                                >
                                  Your browser does not support the audio element.
                                </audio>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {sd.music.title}{sd.music.artist ? ` - ${sd.music.artist}` : ''}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
