"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EditDanceForm } from "@/components/edit-dance-form"
import { DeleteDanceButton } from "@/components/delete-dance-button"
import { useLanguage } from "@/components/language-provider"
import { ExternalLink } from "lucide-react"

interface Dance {
  id: string
  name: string
  name_de?: string | null
  name_ru?: string | null
  description: string | null
  description_de?: string | null
  description_ru?: string | null
  scheme: string | null
  scheme_de?: string | null
  scheme_ru?: string | null
  difficulty: string | null
  origin: string | null
  youtube_url: string | null
  video_url: string | null
}

interface MusicTrack {
  id: string
  title: string
  artist: string | null
  tempo: number | null
  genre: string | null
  audio_url: string | null
}

interface MusicEntry {
  id: string
  title: string
  artist: string
  tempo: string
  genre: string
}

interface DanceDetailContentProps {
  dance: Dance
  musicTracks: MusicTrack[]
  musicForEdit: MusicEntry[]
  ballId?: string
}

export function DanceDetailContent({ dance, musicTracks, musicForEdit, ballId }: DanceDetailContentProps) {
  const { t, language } = useLanguage()

  // Get localized content
  const displayName = language === "ru" 
    ? (dance.name_ru || dance.name) 
    : (dance.name_de || dance.name)
  
  const displayDescription = language === "ru" 
    ? (dance.description_ru || dance.description) 
    : (dance.description_de || dance.description)
  
  const displayScheme = language === "ru" 
    ? (dance.scheme_ru || dance.scheme) 
    : (dance.scheme_de || dance.scheme)

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
    <>
      <Link
        href={ballId ? `/balls/${ballId}` : "/"}
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {ballId ? t("backToBall") : t("backToDances")}
      </Link>

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{displayName}</h1>
            {dance.difficulty && (
              <Badge variant="secondary" className="w-fit">
                {getDifficultyLabel(dance.difficulty)}
              </Badge>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <EditDanceForm dance={dance} musicTracks={musicForEdit} />
            <DeleteDanceButton danceId={dance.id} danceName={displayName} />
          </div>
        </div>
        {dance.origin && (
          <p className="text-muted-foreground">{t("origin")}: {dance.origin}</p>
        )}
      </div>

      {dance.youtube_url && (() => {
        // Extract YouTube video ID from various URL formats
        const getYouTubeId = (url: string): string | null => {
          const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/v\/([^&\n?#]+)/,
          ]
          for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match) return match[1]
          }
          return null
        }
        const videoId = getYouTubeId(dance.youtube_url)
        return videoId ? (
          <div className="mb-8">
            <div className="aspect-video w-full max-w-3xl rounded-lg overflow-hidden border">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        ) : null
      })()}

      {dance.video_url && (
        <div className="mb-8">
          <div className="aspect-video w-full max-w-3xl rounded-lg overflow-hidden border bg-black">
            <video
              src={dance.video_url}
              controls
              className="w-full h-full"
              controlsList="nodownload"
              playsInline
            >
              Your browser does not support the video element.
            </video>
          </div>
        </div>
      )}

      {displayDescription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">{t("description")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {displayDescription}
            </p>
          </CardContent>
        </Card>
      )}

      {displayScheme && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">{t("scheme")}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-mono bg-muted p-4 rounded-md">
              {displayScheme}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("associatedMusic")}</CardTitle>
        </CardHeader>
        <CardContent>
          {musicTracks.length > 0 ? (
            <ul className="space-y-4">
              {musicTracks.map((track) => (
                <li
                  key={track.id}
                  className="p-4 bg-muted rounded-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{track.title}</p>
                      {track.artist && (
                        <p className="text-sm text-muted-foreground">
                          {track.artist}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {track.tempo && <span>{track.tempo} BPM</span>}
                      {track.genre && <Badge variant="outline">{track.genre}</Badge>}
                    </div>
                  </div>
                  {track.audio_url && (
                    <div className="mt-3" key={`audio-${track.id}`}>
                      <audio
                        key={`audio-player-${track.id}`}
                        controls
                        className="w-full"
                        controlsList="nodownload"
                        crossOrigin="anonymous"
                        src={track.audio_url}
                        style={{ minHeight: '40px' }}
                        onCanPlay={() => console.log("[v0] Audio can play:", track.audio_url)}
                        onError={(e) => console.log("[v0] Audio error:", track.audio_url, e.currentTarget.error)}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              {t("noMusicAssociated")}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
