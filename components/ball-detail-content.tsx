'use client'

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
import { Trash2, ArrowLeft } from "lucide-react"

interface MusicTrack {
  id: string
  title: string
  artist: string | null
  audio_url: string | null
}

interface Dance {
  id: string
  name: string
  name_ua: string | null
  name_ru: string | null
  difficulty: string | null
  musicTracks?: MusicTrack[]
}

interface SectionDance {
  id: string
  dances: Dance | null
  order_index: number
  music_ids?: string[]
}

interface SectionText {
  id: string
  order_index: number
  content_ru: string
  content_ua: string
}

interface Section {
  id: string
  name: string
  name_ua: string
  name_ru: string
  order_index: number
  section_dances: SectionDance[]
  section_texts?: SectionText[]
}

interface BallDetailContentProps {
  ball: {
    id: string
    name: string
    name_ua: string | null
    name_ru: string | null
    date: string
    place: string | null
    place_ua: string | null
    place_ru: string | null
    ball_sections: Section[]
  }
  allDances: Dance[]
}

export function BallDetailContent({ ball, allDances }: BallDetailContentProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { isAdmin } = useAuth()

  const displayName = language === "ru"
      ? (ball.name_ru || ball.name)
      : (ball.name_ua || ball.name)

  const displayPlace = language === "ru"
      ? (ball.place_ru || ball.place || "")
      : (ball.place_ua || ball.place || "")
  const formattedDate = formatDate(ball.date, language)

  const getDifficultyLabel = (difficulty: string | null) => {
    if (!difficulty) return null
    const difficultyMap: Record<string, string> = {
      Beginner: t("beginner"),
      Intermediate: t("intermediate"),
      Advanced: t("advanced"),
      Expert: t("expert"),
    }
    return difficultyMap[difficulty] || difficulty
  }

  const getDisplayDanceName = (dance: Dance) => {
    return language === "ru"
        ? (dance.name_ru || dance.name)
        : (dance.name_ua || dance.name)
  }

  const getDisplaySectionName = (index: number) => {
    return language === "ru" ? `Відділення ${index + 1}` : `Відділення ${index + 1}`
  }

  // Display section text by current language with safe fallbacks
  const getDisplayText = (text: any) => {
    if (!text) return ""
    const ru = (text as any).content_ru ?? (text as any).ru ?? (text as any).text_ru ?? (text as any).content
    const ua = (text as any).content_ua ?? (text as any).ua ?? (text as any).text_ua ?? (text as any).content
    return language === "ru" ? (ru ?? "") : (ua ?? "")
  }

  const handleDelete = async () => {
    try {
      await deleteBall(ball.id)
      toast({
        title: t("toastSuccess"),
        description: t("ballDeleted"),
      })
      router.push("/balls")
    } catch (error) {
      console.error("[v0] Delete ball error:", error)
      toast({
        title: t("toastError"),
        description: error instanceof Error ? error.message : t("toastFailedDeleteBall"),
        variant: "destructive",
      })
    }
  }

  const sortedSections = [...ball.ball_sections].sort((a, b) => a.order_index - b.order_index)

  return (
      <div className="space-y-6">
        <div>
          <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
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
              <div className="flex w-full gap-2 sm:justify-end">
                <div className="flex-1 sm:flex-none">
                  <CreateBallForm dances={allDances} ballToEdit={ball} triggerClassName="w-full sm:w-auto" />
                </div>
                <div className="flex-1 sm:flex-none">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full sm:w-auto">
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
              </div>
          )}
        </div>

        <div className="mb-6">
          <Link
            href={`/balls/${ball.id}/info`}
            className="text-primary underline underline-offset-2 font-medium"
          >
            {t("ballInfoLink")}
          </Link>
        </div>

        {sortedSections.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">{t("noSections")}</p>
              </CardContent>
            </Card>
        ) : (
            <div className="space-y-6">
              {sortedSections.map((section, index) => {
                // Combine dances and texts into a single ordered entries array
                const danceEntries = (section.section_dances || []).map((sd: any) => ({
                  kind: 'dance' as const,
                  id: sd.id,
                  order_index: sd.order_index,
                  dance: sd.dances,
                  musicIds: sd.music_ids || [],
                }))
                const textEntries = (section.section_texts || []).map((st: any) => ({
                  kind: 'text' as const,
                  id: st.id,
                  order_index: st.order_index,
                  content_ru: st.content_ru,
                  content_ua: st.content_ua,
                }))

                const combined = [...danceEntries, ...textEntries].sort((a, b) => a.order_index - b.order_index)

                return (
                    <Card key={section.id}>
                      <CardHeader>
                        <CardTitle className="text-xl">
                          {getDisplaySectionName(index)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {combined.length === 0 ? (
                            <p className="text-muted-foreground">{t("noDancesSelected")}</p>
                        ) : (
                            <div>
                              {combined.map((entry: any, entryIndex: number) => {
                                if (entry.kind === 'text') {
                                  return (
                                    <div key={`text-${entry.id}-${entryIndex}`} className="pl-10 pr-4 py-6 border-b last:border-0">
                                      <div>
                                        <p className="text-base text-[#6b3e26] whitespace-pre-wrap font-semibold">
                                          {getDisplayText(entry)}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                }

                                const sd = entry
                                if (!sd.dance) return null
                                const danceNumber = combined.slice(0, entryIndex).filter((e: any) => e.kind === 'dance').length + 1

                                // Resolve selected tracks via allDances cache
                                const danceTracks = (allDances.find(d => d.id === sd.dance.id)?.musicTracks || [])
                                const selectedTracks = danceTracks.filter(t => (sd.musicIds || []).includes(t.id))

                                return (
                                  <div key={`dance-${sd.id}-${entryIndex}`} className="py-6 border-b last:border-0">
                                    <div className="flex items-center gap-4">
                                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-sm font-semibold text-primary">{danceNumber}</span>
                                      </div>
                                      <Link
                                        href={`/dance/${sd.dance.id}?ballId=${ball.id}`}
                                        className="flex-1 transition-colors hover:text-primary cursor-pointer"
                                        title={`${getDisplayDanceName(sd.dance)} — open dance details`}
                                      >
                                        <div>
                                          <h4 className="font-semibold text-[#6b3e26] underline">{getDisplayDanceName(sd.dance)}</h4>
                                          {sd.dance.difficulty && (
                                            <p className="text-xs text-muted-foreground mt-0 no-underline">{getDifficultyLabel(sd.dance.difficulty)}</p>
                                          )}
                                        </div>
                                      </Link>
                                    </div>
                                    {selectedTracks.length > 0 && (
                                      <div className="ml-10 pt-4 space-y-3">
                                        {selectedTracks.map(track => (
                                          <div key={track.id}>
                                            <div className="text-xs text-muted-foreground mb-1">
                                              {track.title}{track.artist ? ` — ${track.artist}` : ''}
                                            </div>
                                            {track.audio_url && (
                                              <audio controls className="w-full h-10" controlsList="nodownload" crossOrigin="anonymous" src={track.audio_url}>
                                                Your browser does not support the audio element.
                                              </audio>
                                            )}
                                          </div>
                                        ))}
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
