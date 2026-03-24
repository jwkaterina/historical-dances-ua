"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { TutorialForm } from "@/components/tutorial-form"
import { deleteTutorial } from "@/app/actions/tutorials"
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
import { Trash2 } from "lucide-react"

interface Tutorial {
  id: string
  title_ua: string
  title_ru: string
  type: 'video' | 'pdf' | 'image'
  video_type: 'youtube' | 'uploaded' | null
  url: string
  category_id: string | null
}

interface Category {
  id: string
  name_ua: string
  name_ru: string
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

export function TutorialDetailContent({ tutorial, categories, danceId }: { tutorial: Tutorial; categories: Category[]; danceId?: string }) {
  const { t, language } = useLanguage()
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const title = language === 'ru' ? tutorial.title_ru : tutorial.title_ua
  const backHref = danceId ? `/dance/${danceId}` : "/tutorials"
  const backLabel = danceId ? t("backToDance") : t("backToTutorials")

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteTutorial(tutorial.id)
      toast({ title: t("toastSuccess"), description: t("toastTutorialDeleted") })
      router.push("/tutorials")
    } catch {
      toast({ title: t("toastError"), description: t("toastFailedDeleteTutorial"), variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Link
          href={backHref}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">{backLabel}</span>
        </Link>
        {isAdmin && (
          <div className="flex gap-2 items-center animate-in fade-in duration-300">
            <TutorialForm mode="edit" tutorial={tutorial} categories={categories} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{t("delete")}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteConfirmTutorial")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("deleteConfirmMessageTutorial")} &quot;{title}&quot;
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? t("deleting") : t("delete")}
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

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
