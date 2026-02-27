"use client"

import { useState, Suspense } from "react"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { SearchInput } from "@/components/search-input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TutorialForm } from "@/components/tutorial-form"
import { deleteTutorial } from "@/app/actions/tutorials"
import { Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

interface Tutorial {
  id: string
  title_de: string
  title_ru: string
  type: 'video' | 'pdf' | 'image'
  video_type: 'youtube' | 'uploaded' | null
  url: string
  category_id: string | null
  created_at: string
}

interface Category {
  id: string
  name_de: string
  name_ru: string
}

interface TutorialsContentProps {
  tutorials: Tutorial[]
  categories: Category[]
  query?: string
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

function DeleteTutorialButton({ id, title }: { id: string; title: string }) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteTutorial(id)
      toast({ title: t("toastSuccess"), description: t("toastTutorialDeleted") })
    } catch {
      toast({ title: t("toastError"), description: t("toastFailedDeleteTutorial"), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background shadow-sm text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteConfirmTutorial")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteConfirmMessageTutorial")} {`"${title}"`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3">
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? t("deleting") : t("delete")}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function VideoPlayer({ tutorial }: { tutorial: Tutorial }) {
  if (tutorial.video_type === 'youtube') {
    const videoId = getYouTubeId(tutorial.url)
    if (!videoId) return null
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden border">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={tutorial.title_de}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    )
  }

  if (tutorial.video_type === 'uploaded') {
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden border bg-black">
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
    )
  }

  return null
}

function ImageCard({ tutorial, title }: { tutorial: Tutorial; title: string }) {
  const [fullscreen, setFullscreen] = useState(false)
  return (
    <>
      <div
        className="w-full aspect-video rounded-lg overflow-hidden border bg-muted cursor-zoom-in"
        onClick={() => setFullscreen(true)}
      >
        <img
          src={tutorial.url}
          alt={title}
          className="w-full h-full object-contain"
        />
      </div>
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-zoom-out"
          onClick={() => setFullscreen(false)}
        >
          <img
            src={tutorial.url}
            alt={title}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  )
}

function PdfCard({ tutorial, title }: { tutorial: Tutorial; title: string }) {
  const [fullscreen, setFullscreen] = useState(false)
  return (
    <>
      <div
        className="w-full aspect-video rounded-lg overflow-hidden border bg-muted cursor-pointer"
        onClick={() => setFullscreen(true)}
      >
        <div className="w-full h-full px-[30%]">
          <iframe
            src={`${tutorial.url}#toolbar=0&navpanes=0&scrollbar=0`}
            title={title}
            className="w-full h-full pointer-events-none"
          />
        </div>
      </div>
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex justify-end p-2 border-b shrink-0">
            <Button variant="ghost" size="icon" onClick={() => setFullscreen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <iframe
            src={tutorial.url}
            title={title}
            className="flex-1 w-full"
          />
        </div>
      )}
    </>
  )
}

export function TutorialsContent({ tutorials, categories, query }: TutorialsContentProps) {
  const { t, language } = useLanguage()
  const { isAdmin } = useAuth()
  const [manageMode, setManageMode] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all")

  const categoryMap = Object.fromEntries(categories.map((cat) => [cat.id, cat]))

  const filtered = tutorials.filter((tut) => {
    if (activeCategoryId !== "all" && tut.category_id !== activeCategoryId) return false
    if (!query) return true
    const lowerQuery = query.toLowerCase()
    return (
      tut.title_de.toLowerCase().includes(lowerQuery) ||
      tut.title_ru.toLowerCase().includes(lowerQuery)
    )
  })

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("tutorialsTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("tutorialsDescription")}</p>
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-2 sm:flex-row shrink-0">
            <TutorialForm mode="create" categories={categories} />
            <Button
              variant={manageMode ? "secondary" : "outline"}
              size="sm"
              onClick={() => setManageMode(!manageMode)}
            >
              <span className="relative inline-flex justify-center">
                <span className="invisible">{t("edit")}</span>
                <span className="absolute">{manageMode ? t("done") : t("edit")}</span>
              </span>
            </Button>
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <Suspense fallback={null}>
            <SearchInput placeholder={t("searchTutorials")} />
          </Suspense>
        </div>
        <div className="w-full sm:w-64">
          <Select value={activeCategoryId} onValueChange={setActiveCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder={t("allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {language === 'ru' ? cat.name_ru : cat.name_de}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {filtered.map((tutorial) => {
            const title = language === 'ru' ? tutorial.title_ru : tutorial.title_de
            const category = tutorial.category_id ? categoryMap[tutorial.category_id] : null
            const categoryName = category ? (language === 'ru' ? category.name_ru : category.name_de) : null
            return (
              <Card key={tutorial.id} className="transition-all hover:shadow-md relative">
                {isAdmin && manageMode && (
                  <div className="absolute top-2 right-2 z-10 flex gap-1">
                    <TutorialForm mode="edit" tutorial={tutorial} categories={categories} iconOnly />
                    <DeleteTutorialButton id={tutorial.id} title={title} />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground">{title}</h3>
                      {categoryName && (
                        <Badge variant="secondary" className="shrink-0">{categoryName}</Badge>
                      )}
                    </div>

                    {tutorial.type === 'video' ? (
                      <VideoPlayer tutorial={tutorial} />
                    ) : tutorial.type === 'image' ? (
                      <ImageCard tutorial={tutorial} title={title} />
                    ) : (
                      <PdfCard tutorial={tutorial} title={title} />
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
            {query ? `${t("noTutorialsForQuery")} "${query}"` : t("noTutorialsFound")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {query ? t("tryDifferentSearch") : t("addTutorialsToStart")}
          </p>
        </div>
      )}
    </>
  )
}
