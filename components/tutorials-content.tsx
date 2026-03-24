"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { SearchInput } from "@/components/search-input"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TutorialForm } from "@/components/tutorial-form"
import { updateCategory, deleteCategory, createCategory } from "@/app/actions/tutorials"
import { Pencil, Trash2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  title_ua: string
  title_ru: string
  type: 'video' | 'pdf' | 'image'
  video_type: 'youtube' | 'uploaded' | null
  url: string
  category_id: string | null
  created_at: string
}

interface Category {
  id: string
  name_ua: string
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

function ManageCategoriesDialog({ categories, onOpen, compact }: { categories: Category[]; onOpen?: () => void; compact?: boolean }) {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editUa, setEditUa] = useState("")
  const [editRu, setEditRu] = useState("")
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [newUa, setNewUa] = useState("")
  const [newRu, setNewRu] = useState("")
  const [savingNew, setSavingNew] = useState(false)

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditUa(cat.name_ua)
    setEditRu(cat.name_ru)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditUa("")
    setEditRu("")
  }

  const handleSave = async (id: string) => {
    if (!editUa.trim() || !editRu.trim()) {
      toast({ title: t("toastError"), description: t("categoryNameRequired"), variant: "destructive" })
      return
    }
    setSavingId(id)
    try {
      await updateCategory(id, { name_ua: editUa.trim(), name_ru: editRu.trim() })
      toast({ title: t("toastSuccess"), description: t("toastCategoryUpdated") })
      cancelEdit()
    } catch {
      toast({ title: t("toastError"), description: t("toastFailedUpdateCategory"), variant: "destructive" })
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteCategory(id)
      toast({ title: t("toastSuccess"), description: t("toastCategoryDeleted") })
    } catch {
      toast({ title: t("toastError"), description: t("toastFailedDeleteCategory"), variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreate = async () => {
    if (!newUa.trim() || !newRu.trim()) {
      toast({ title: t("toastError"), description: t("categoryNameRequired"), variant: "destructive" })
      return
    }
    setSavingNew(true)
    try {
      await createCategory({ name_ua: newUa.trim(), name_ru: newRu.trim() })
      toast({ title: t("toastSuccess"), description: t("toastCategoryCreated") })
      setNewUa("")
      setNewRu("")
    } catch {
      toast({ title: t("toastError"), description: t("toastFailedCreateCategory"), variant: "destructive" })
    } finally {
      setSavingNew(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) onOpen?.(); setOpen(v) }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{t("manageCategories")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm max-h-[80vh] overflow-y-auto px-5 sm:px-6">
        <DialogHeader>
          <DialogTitle>{t("manageCategories")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">{t("noCategory")}</p>
          )}
          {categories.map((cat) => {
            const name = language === 'ru' ? cat.name_ru : cat.name_ua
            const isEditing = editingId === cat.id
            return (
              <div key={cat.id} className="rounded-md border p-3 space-y-2">
                {isEditing ? (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("categoryNameUa")}</Label>
                      <Input
                        value={editUa}
                        onChange={(e) => setEditUa(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("categoryNameRu")}</Label>
                      <Input
                        value={editRu}
                        onChange={(e) => setEditRu(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleSave(cat.id)} disabled={savingId === cat.id}>
                        {savingId === cat.id ? t("saving") : t("update")}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={cancelEdit}>
                        {t("cancel")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">{name}</span>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(cat)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("deleteConfirmCategory")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("deleteConfirmMessageCategory")} {`"${name}"`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(cat.id)}
                              disabled={deletingId === cat.id}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deletingId === cat.id ? t("deleting") : t("delete")}
                            </AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium">{t("createNewCategory")}</p>
          <div className="space-y-1">
            <Label className="text-xs">{t("categoryNameUa")}</Label>
            <Input
              value={newUa}
              onChange={(e) => setNewUa(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t("categoryNameRu")}</Label>
            <Input
              value={newRu}
              onChange={(e) => setNewRu(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <Button size="sm" onClick={handleCreate} disabled={savingNew}>
            {savingNew ? t("saving") : t("create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
          title={tutorial.title_ua}
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
  const { isAdmin, loading: authLoading } = useAuth()
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all")

  const categoryMap = Object.fromEntries(categories.map((cat) => [cat.id, cat]))

  const filtered = tutorials.filter((tut) => {
    if (activeCategoryId !== "all" && tut.category_id !== activeCategoryId) return false
    if (!query) return true
    const lowerQuery = query.toLowerCase()
    return (
      tut.title_ua.toLowerCase().includes(lowerQuery) ||
      tut.title_ru.toLowerCase().includes(lowerQuery)
    )
  })

  return (
    <>
      <div className={`grid transition-all duration-300 ease-in-out ${isAdmin ? "grid-rows-[1fr] opacity-100 mb-4" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden flex justify-end gap-2">
          <TutorialForm mode="create" categories={categories} />
          <ManageCategoriesDialog categories={categories} />
        </div>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t("tutorialsTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("tutorialsDescription")}</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <Suspense fallback={null}>
            <SearchInput placeholder={t("searchTutorials")} />
          </Suspense>
        </div>
        <div className="self-end">
          <Select value={activeCategoryId} onValueChange={setActiveCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder={t("allCategories")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCategories")}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {language === 'ru' ? cat.name_ru : cat.name_ua}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {filtered.map((tutorial) => {
            const title = language === 'ru' ? tutorial.title_ru : tutorial.title_ua
            const category = tutorial.category_id ? categoryMap[tutorial.category_id] : null
            const categoryName = category ? (language === 'ru' ? category.name_ru : category.name_ua) : null
            return (
              <Link key={tutorial.id} href={`/tutorials/${tutorial.id}`}>
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
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
              </Link>
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
