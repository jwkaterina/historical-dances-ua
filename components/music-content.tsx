"use client"

import { useLanguage } from "@/components/language-provider"
import { SearchInput } from "@/components/search-input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Suspense } from "react"

interface MusicTrack {
  id: string
  title: string
  artist: string | null
  tempo: number | null
  genre: string | null
  audio_url: string | null
  dance_music?: Array<{
    dances: {
      id: string
      name: string
      name_ua?: string | null
      name_ru?: string | null
    } | null
  }>
}

interface MusicContentProps {
  music: MusicTrack[]
  query?: string
}

export function MusicContent({ music, query }: MusicContentProps) {
  const { t, language } = useLanguage()

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t("musicLibrary")}</h1>
        <p className="mt-2 text-muted-foreground">{t("musicDescription")}</p>
      </div>

      <div className="mb-6">
        <Suspense fallback={null}>
          <SearchInput placeholder={t("searchMusic")} />
        </Suspense>
      </div>

      {music && music.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {music.map((track) => {
            const associatedDances = track.dance_music
              ?.map((dm) => dm.dances)
              .filter(Boolean) || []
            
            // Get localized dance names
            const localizedDanceNames = associatedDances.map((dance: any) => {
              if (language === "ru") {
                return dance.name_ru || dance.name
              }
              return dance.name_ua || dance.name
            })

            // Count how many tracks each associated dance has
            const danceHasMultipleTracks = associatedDances.some((dance: any) => {
              const trackCount = music.filter(m => 
                m.dance_music?.some(dm => dm.dances?.id === dance.id)
              ).length
              return trackCount > 1
            })

            // Show track title only if:
            // 1. No dance is associated with this track, OR
            // 2. The associated dance has multiple tracks
            const shouldShowTrackTitle = localizedDanceNames.length === 0 || danceHasMultipleTracks

            return (
              <Card key={track.id} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div>
                      {/* Show dance name prominently if available */}
                      {localizedDanceNames.length > 0 && (
                        <h3 className="font-semibold text-foreground truncate">
                          {localizedDanceNames.length === 1 
                            ? localizedDanceNames[0]
                            : localizedDanceNames.join(", ")}
                        </h3>
                      )}
                      
                      {/* Show track title only if dance has multiple tracks */}
                      {shouldShowTrackTitle && track.title && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {track.title}
                        </p>
                      )}
                      
                      {track.artist && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {track.artist}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {track.tempo && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {track.tempo} BPM
                          </span>
                        )}
                        {track.genre && (
                          <Badge variant="outline" className="text-xs">
                            {track.genre}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {track.audio_url && (
                      <div className="mt-2" key={`audio-${track.id}`}>
                        <audio
                          key={`audio-player-${track.id}`}
                          controls
                          className="w-full"
                          controlsList="nodownload"
                          crossOrigin="anonymous"
                          src={track.audio_url}
                          style={{ minHeight: '40px' }}
                          onCanPlay={() => console.log("[v0] Music audio can play:", track.audio_url)}
                          onError={(e) => console.log("[v0] Music audio error:", track.audio_url, e.currentTarget.error)}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg text-muted-foreground">
            {query ? `${t("noMusicForQuery")} "${query}"` : t("noMusicFound")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {query ? t("tryDifferentSearch") : t("addMusicToStart")}
          </p>
        </div>
      )}
    </>
  )
}
