"use client"

import Link from "next/link"
import { useLanguage } from "@/components/language-provider"

interface Tutorial {
  id: string
  title_ua: string
  title_ru: string
  type: 'video' | 'pdf' | 'image'
  video_type: 'youtube' | 'uploaded' | null
  url: string
}

function getYouTubeId(url: string): string | null {
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

export function TutorialDetailContent({ tutorial, danceId }: { tutorial: Tutorial; danceId?: string }) {
  const { t, language } = useLanguage()
  const title = language === 'ru' ? tutorial.title_ru : tutorial.title_ua
  const backHref = danceId ? `/dance/${danceId}` : "/tutorials"
  const backLabel = danceId ? t("backToDance") : t("backToTutorials")

  return (
    <>
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {backLabel}
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">{title}</h1>

      {tutorial.type === 'video' && tutorial.video_type === 'youtube' && (() => {
        const videoId = getYouTubeId(tutorial.url)
        if (!videoId) return null
        return (
          <div className="aspect-video w-full max-w-3xl rounded-lg overflow-hidden border">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        )
      })()}

      {tutorial.type === 'video' && tutorial.video_type === 'uploaded' && (
        <div className="aspect-video w-full max-w-3xl rounded-lg overflow-hidden border bg-black">
          <video
            src={tutorial.url}
            controls
            className="w-full h-full"
            controlsList="nodownload"
            playsInline
          >
            Your browser does not support the video element.
          </video>
        </div>
      )}

      {tutorial.type === 'image' && (
        <div className="w-full max-w-3xl rounded-lg overflow-hidden border bg-muted">
          <img
            src={tutorial.url}
            alt={title}
            className="w-full h-auto object-contain"
          />
        </div>
      )}

      {tutorial.type === 'pdf' && (
        <div className="w-full max-w-3xl rounded-lg overflow-hidden border bg-muted" style={{ height: '80vh' }}>
          <iframe
            src={`${tutorial.url}#toolbar=1&navpanes=1`}
            title={title}
            className="w-full h-full"
          />
        </div>
      )}
    </>
  )
}
