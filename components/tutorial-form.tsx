"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/components/language-provider"
import { useToast } from "@/hooks/use-toast"
import { createTutorial, updateTutorial, type TutorialData } from "@/app/actions/tutorials"
import { Pencil, Plus, Upload } from "lucide-react"

interface Tutorial {
  id: string
  title_de: string
  title_ru: string
  type: 'video' | 'pdf' | 'image'
  video_type: 'youtube' | 'uploaded' | null
  url: string
  category_id: string | null
}

interface Category {
  id: string
  name_de: string
  name_ru: string
}

interface TutorialFormProps {
  mode: 'create' | 'edit'
  tutorial?: Tutorial
  categories: Category[]
  onSuccess?: () => void
  onOpen?: () => void
  iconOnly?: boolean
}

export function TutorialForm({ mode, tutorial, categories, onSuccess, onOpen, iconOnly }: TutorialFormProps) {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [titleDe, setTitleDe] = useState(tutorial?.title_de ?? "")
  const [titleRu, setTitleRu] = useState(tutorial?.title_ru ?? "")
  const [type, setType] = useState<'video' | 'pdf' | 'image'>(tutorial?.type ?? "video")
  const [videoType, setVideoType] = useState<'youtube' | 'uploaded'>(
    tutorial?.video_type ?? "youtube"
  )
  const [url, setUrl] = useState(tutorial?.url ?? "")
  const [fileName, setFileName] = useState("")
  const [categoryId, setCategoryId] = useState<string>(tutorial?.category_id ?? "none")

  const resetForm = () => {
    setTitleDe(tutorial?.title_de ?? "")
    setTitleRu(tutorial?.title_ru ?? "")
    setType(tutorial?.type ?? "video")
    setVideoType(tutorial?.video_type ?? "youtube")
    setUrl(tutorial?.url ?? "")
    setFileName("")
    setCategoryId(tutorial?.category_id ?? "none")
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      resetForm()
      onOpen?.()
    }
    setOpen(newOpen)
  }

  const uploadFile = async (file: File): Promise<string> => {
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Upload failed")
    }

    const { uploadUrl, publicUrl } = await response.json()

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    })

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to storage")
    }

    return publicUrl
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isPdf = type === 'pdf'
    const isVideo = type === 'video'
    const isImage = type === 'image'

    if (isPdf && file.type !== "application/pdf") {
      toast({ title: t("toastError"), description: t("toastSelectPdfFile"), variant: "destructive" })
      return
    }
    if (isVideo && !file.type.startsWith("video/")) {
      toast({ title: t("toastError"), description: t("toastSelectVideoFile"), variant: "destructive" })
      return
    }
    if (isImage && !file.type.startsWith("image/")) {
      toast({ title: t("toastError"), description: t("toastSelectImageFile"), variant: "destructive" })
      return
    }

    const maxSize = isPdf ? 50 * 1024 * 1024 : isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024
    if (file.size > maxSize) {
      const msg = isPdf ? t("toastPdfTooLarge") : isImage ? t("toastImageTooLarge") : t("toastVideoTooLarge")
      toast({ title: t("toastError"), description: msg, variant: "destructive" })
      return
    }

    setUploading(true)
    try {
      const uploadedUrl = await uploadFile(file)
      setUrl(uploadedUrl)
      setFileName(file.name)
    } catch (err) {
      const msg = isPdf ? t("toastFailedUploadPdf") : isImage ? t("toastFailedUploadImage") : t("toastFailedUploadVideo")
      toast({ title: t("toastError"), description: msg, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!titleDe.trim() || !titleRu.trim()) {
      toast({ title: t("toastError"), description: t("titleRequired"), variant: "destructive" })
      return
    }

    if (!url.trim()) {
      toast({ title: t("toastError"), description: t("urlRequired"), variant: "destructive" })
      return
    }

    const data: TutorialData = {
      title_de: titleDe.trim(),
      title_ru: titleRu.trim(),
      type,
      video_type: type === 'video' ? videoType : null,
      url: url.trim(),
      category_id: categoryId === "none" ? null : categoryId,
    }

    setLoading(true)
    try {
      if (mode === 'create') {
        await createTutorial(data)
        toast({ title: t("toastSuccess"), description: t("toastTutorialCreated") })
      } else if (tutorial) {
        await updateTutorial(tutorial.id, data)
        toast({ title: t("toastSuccess"), description: t("toastTutorialUpdated") })
      }
      setOpen(false)
      onSuccess?.()
    } catch (err) {
      const msg = mode === 'create' ? t("toastFailedCreateTutorial") : t("toastFailedUpdateTutorial")
      toast({ title: t("toastError"), description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t("addNewTutorial")}
          </Button>
        ) : iconOnly ? (
          <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/80 hover:bg-background shadow-sm">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-1" />
            {t("edit")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t("createTutorial") : t("editTutorial")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("tutorialTitleDe")}</Label>
            <Input
              value={titleDe}
              onChange={(e) => setTitleDe(e.target.value)}
              placeholder={t("tutorialTitleDe")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t("tutorialTitleRu")}</Label>
            <Input
              value={titleRu}
              onChange={(e) => setTitleRu(e.target.value)}
              placeholder={t("tutorialTitleRu")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t("tutorialType")}</Label>
            <Select value={type} onValueChange={(v) => { setType(v as 'video' | 'pdf' | 'image'); setUrl(""); setFileName("") }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">{t("tutorialTypeVideo")}</SelectItem>
                <SelectItem value="pdf">{t("tutorialTypePdf")}</SelectItem>
                <SelectItem value="image">{t("tutorialTypeImage")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'video' && (
            <div className="space-y-2">
              <Label>{t("videoType")}</Label>
              <Select value={videoType} onValueChange={(v) => { setVideoType(v as 'youtube' | 'uploaded'); setUrl(""); setFileName("") }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">{t("videoTypeYoutube")}</SelectItem>
                  <SelectItem value="uploaded">{t("videoTypeUploaded")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'video' && videoType === 'youtube' && (
            <div className="space-y-2">
              <Label>{t("youtubeUrl")}</Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t("youtubePlaceholder")}
              />
            </div>
          )}

          {type === 'video' && videoType === 'uploaded' && (
            <div className="space-y-2">
              <Label>{t("videoFile")}</Label>
              {url && !fileName && (
                <p className="text-xs text-muted-foreground truncate">{t("videoUploaded")}</p>
              )}
              {fileName && (
                <p className="text-xs text-muted-foreground truncate">{fileName}</p>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {uploading ? t("uploading") : t("selectVideo")}
                </span>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>
          )}

          {type === 'pdf' && (
            <div className="space-y-2">
              <Label>{t("pdfFile")}</Label>
              {url && !fileName && (
                <p className="text-xs text-muted-foreground truncate">{t("pdfUploaded")}</p>
              )}
              {fileName && (
                <p className="text-xs text-muted-foreground truncate">{fileName}</p>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {uploading ? t("uploading") : t("selectPdf")}
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>
          )}

          {type === 'image' && (
            <div className="space-y-2">
              <Label>{t("imageFile")}</Label>
              {url && !fileName && (
                <p className="text-xs text-muted-foreground truncate">{t("imageUploaded")}</p>
              )}
              {fileName && (
                <p className="text-xs text-muted-foreground truncate">{fileName}</p>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {uploading ? t("uploading") : t("selectImage")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("category")}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder={t("noCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("noCategory")}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {language === 'ru' ? cat.name_ru : cat.name_de}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? t("saving") : mode === 'create' ? t("create") : t("update")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
