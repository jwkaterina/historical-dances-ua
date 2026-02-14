"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { updateDance } from "@/app/actions/dance"
import { Pencil, Plus, Trash2, Upload, X } from "lucide-react"

interface MusicEntry {
  id?: string
  title: string
  artist: string
  tempo: string
  genre: string
  audio_url?: string
}

interface VideoEntry {
  id?: string
  video_type: 'youtube' | 'uploaded'
  url: string
}

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
  youtube_url: string | null
  video_url: string | null
  origin?: string | null
}

interface EditDanceFormProps {
  dance: Dance
  musicTracks: MusicEntry[]
  videoEntries: VideoEntry[]
}

export function EditDanceForm({ dance, musicTracks, videoEntries }: EditDanceFormProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const { isAdmin, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nameDe, setNameDe] = useState(dance.name_de || dance.name || "")
  const [descriptionDe, setDescriptionDe] = useState(dance.description_de || dance.description || "")
  const [schemeDe, setSchemeDe] = useState(dance.scheme_de || dance.scheme || "")
  const [nameRu, setNameRu] = useState(dance.name_ru || "")
  const [descriptionRu, setDescriptionRu] = useState(dance.description_ru || "")
  const [schemeRu, setSchemeRu] = useState(dance.scheme_ru || "")
  const [difficulty, setDifficulty] = useState(dance.difficulty || "")
  const [uploading, setUploading] = useState(false)

  // Video entries state
  const [videoFormEntries, setVideoFormEntries] = useState<VideoEntry[]>(videoEntries)
  const [videoFiles, setVideoFiles] = useState<Record<number, File | null>>({})

  // Helper function to get music entries from props (only tracks with audio)
  const getInitialMusicEntries = (): MusicEntry[] => {
    const tracksWithAudio = musicTracks.filter((m) => m.audio_url && m.audio_url.trim() !== '')
    return tracksWithAudio.length > 0
      ? tracksWithAudio.map((m) => ({
          id: m.id,
          title: m.title || "",
          artist: m.artist || "",
          tempo: m.tempo || "",
          genre: m.genre || "",
          audio_url: m.audio_url || "",
        }))
      : [{ title: "", artist: "", tempo: "", genre: "", audio_url: "" }]
  }
  
  const [musicEntries, setMusicEntries] = useState<MusicEntry[]>(getInitialMusicEntries)
  const [musicAudioFiles, setMusicAudioFiles] = useState<Record<number, File | null>>({})
  
  // Reset all form fields to original values
  const resetForm = () => {
    setNameDe(dance.name_de || dance.name || "")
    setDescriptionDe(dance.description_de || dance.description || "")
    setSchemeDe(dance.scheme_de || dance.scheme || "")
    setNameRu(dance.name_ru || "")
    setDescriptionRu(dance.description_ru || "")
    setSchemeRu(dance.scheme_ru || "")
    setDifficulty(dance.difficulty || "")
    setMusicEntries(getInitialMusicEntries())
    setMusicAudioFiles({})
    setVideoFormEntries(videoEntries)
    setVideoFiles({})
  }
  
  // Reset form when dialog opens to ensure clean state
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // When opening, reset to original values from props
      resetForm()
    }
    setOpen(newOpen)
  }

  // Check if we need to show title fields (more than 1 track)
  const showTitleFields = musicEntries.length > 1

  const addMusicEntry = () => {
    setMusicEntries([...musicEntries, { title: "", artist: "", tempo: "", genre: "", audio_url: "" }])
  }

  const removeMusicEntry = (index: number) => {
    if (musicEntries.length > 1) {
      setMusicEntries(musicEntries.filter((_, i) => i !== index))
      const newAudioFiles = { ...musicAudioFiles }
      delete newAudioFiles[index]
      setMusicAudioFiles(newAudioFiles)
    } else {
      setMusicEntries([{ title: "", artist: "", tempo: "", genre: "", audio_url: "" }])
      setMusicAudioFiles({})
    }
  }

  const updateMusicEntry = (index: number, field: keyof Omit<MusicEntry, "id" | "audio_url">, value: string) => {
    const updated = [...musicEntries]
    updated[index][field] = value
    setMusicEntries(updated)
  }

  // Video entry functions
  const addVideoEntry = (type: 'youtube' | 'uploaded') => {
    setVideoFormEntries([...videoFormEntries, { video_type: type, url: "" }])
  }

  const removeVideoEntry = (index: number) => {
    setVideoFormEntries(videoFormEntries.filter((_, i) => i !== index))
    const newVideoFiles = { ...videoFiles }
    delete newVideoFiles[index]
    setVideoFiles(newVideoFiles)
  }

  const updateVideoEntry = (index: number, url: string) => {
    const updated = [...videoFormEntries]
    updated[index].url = url
    setVideoFormEntries(updated)
  }

  const handleVideoUpload = async (file: File): Promise<string | null> => {
    setUploading(true)
    try {
      // Check file size (100MB limit)
      const MAX_VIDEO_SIZE = 100 * 1024 * 1024
      if (file.size > MAX_VIDEO_SIZE) {
        throw new Error(t("toastVideoTooLarge"))
      }

      // Get signed upload URL from our API
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to get upload URL")
      }

      const { uploadUrl, publicUrl } = await response.json()

      // Upload directly to Supabase Storage using signed URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error("Upload to storage failed")
      }

      return publicUrl
    } catch (error) {
      console.error("Video upload error:", error)
      toast({
        title: t("toastError"),
        description: error instanceof Error ? error.message : t("toastFailedUploadVideo"),
        variant: "destructive",
      })
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleAudioUpload = async (file: File): Promise<string | null> => {
    try {
      // Check file size (20MB limit for audio)
      const MAX_SIZE = 20 * 1024 * 1024
      if (file.size > MAX_SIZE) {
        throw new Error(t("toastAudioTooLarge"))
      }

      // Get signed upload URL from our API
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to get upload URL")
      }

      const { uploadUrl, publicUrl } = await response.json()

      // Upload directly to Supabase Storage using signed URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error("Upload to storage failed")
      }

      return publicUrl
    } catch (error) {
      console.error("Audio upload error:", error)
      toast({
        title: t("toastError"),
        description: error instanceof Error ? error.message : t("toastFailedUploadAudio"),
        variant: "destructive",
      })
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that both language names are provided
    if (!nameDe.trim() || !nameRu.trim()) {
      toast({
        title: t("toastError"),
        description: t("toastNameRequiredBothLanguages"),
        variant: "destructive",
      })
      return
    }

    // If multiple tracks, validate that all tracks have titles
    if (showTitleFields) {
      const hasEmptyTitles = musicEntries.some((m, i) => 
        (musicAudioFiles[i] || m.audio_url) && !m.title.trim()
      )
      if (hasEmptyTitles) {
        toast({
          title: t("toastError"),
          description: t("toastMusicTitleRequired"),
          variant: "destructive",
        })
        return
      }
    }
    
    setLoading(true)

    try {
      // Process video entries - upload files if needed
      const processedVideoEntries = await Promise.all(
        videoFormEntries.map(async (video, index) => {
          let url = video.url
          // If there's a pending file upload for this entry
          if (video.video_type === 'uploaded' && videoFiles[index]) {
            const uploadedUrl = await handleVideoUpload(videoFiles[index]!)
            if (uploadedUrl) {
              url = uploadedUrl
            }
          }
          return { ...video, url }
        })
      )

      // Filter to only entries with valid URLs
      const validVideoEntries = processedVideoEntries.filter(v => v.url && v.url.trim() !== '')

      // Upload audio files for music entries
      const musicEntriesWithAudio = await Promise.all(
        musicEntries.map(async (music, index) => {
          let audioUrl = music.audio_url || ""
          if (musicAudioFiles[index]) {
            const uploadedUrl = await handleAudioUpload(musicAudioFiles[index]!)
            if (uploadedUrl) {
              audioUrl = uploadedUrl
            }
          }
          return { ...music, audio_url: audioUrl }
        })
      )

      // Get the dance name based on current language for auto-title
      const danceName = language === "ru" ? (nameRu || nameDe) : (nameDe || nameRu)

      // Filter to only include music entries that have audio files
      const musicWithAudio = musicEntriesWithAudio.filter((m) => m.audio_url && m.audio_url.trim() !== '')

      // Prepare music entries with proper titles
      const musicEntriesForSubmit = musicWithAudio.map((music) => ({
        ...music,
        // If only one track, use dance name as title; otherwise use the entered title
        title: musicWithAudio.length > 1 ? music.title : danceName,
      }))

      // Call server action to update dance
      await updateDance(
        {
          id: dance.id,
          name: nameDe || nameRu,
          name_de: nameDe || null,
          name_ru: nameRu || null,
          description: descriptionDe || descriptionRu || null,
          description_de: descriptionDe || null,
          description_ru: descriptionRu || null,
          scheme: schemeDe || schemeRu || null,
          scheme_de: schemeDe || null,
          scheme_ru: schemeRu || null,
          difficulty: difficulty || null,
          origin: dance.origin ?? null,
        },
        musicEntriesForSubmit,
        validVideoEntries
      )

      toast({
        title: t("toastSuccess"),
        description: t("toastDanceUpdated"),
      })
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error updating dance:", error)
      toast({
        title: t("toastError"),
        description: error instanceof Error ? error.message : t("toastFailedUpdateDance"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Only show for admins
  if (authLoading || !isAdmin) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Pencil className="mr-2 h-4 w-4" />
          {t("editDance")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:max-w-2xl px-3 sm:px-6 pb-24 sm:pb-6">
        <DialogHeader>
          <DialogTitle>{t("editDance")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nameRu">{t("danceName")} (Русский) *</Label>
              <Input
                id="edit-nameRu"
                value={nameRu}
                onChange={(e) => setNameRu(e.target.value)}
                placeholder={t("danceNamePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-nameDe">{t("danceName")} (Deutsch) *</Label>
              <Input
                id="edit-nameDe"
                value={nameDe}
                onChange={(e) => setNameDe(e.target.value)}
                placeholder={t("danceNamePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-descriptionRu">{t("descriptionLabel")} (Русский)</Label>
              <Textarea
                id="edit-descriptionRu"
                value={descriptionRu}
                onChange={(e) => setDescriptionRu(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-descriptionDe">{t("descriptionLabel")} (Deutsch)</Label>
              <Textarea
                id="edit-descriptionDe"
                value={descriptionDe}
                onChange={(e) => setDescriptionDe(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-schemeRu">{t("schemeLabel")} (Русский)</Label>
              <Textarea
                id="edit-schemeRu"
                value={schemeRu}
                onChange={(e) => setSchemeRu(e.target.value)}
                placeholder={t("schemePlaceholder")}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-schemeDe">{t("schemeLabel")} (Deutsch)</Label>
              <Textarea
                id="edit-schemeDe"
                value={schemeDe}
                onChange={(e) => setSchemeDe(e.target.value)}
                placeholder={t("schemePlaceholder")}
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-difficulty">{t("difficulty")}</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectDifficulty")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">{t("beginner")}</SelectItem>
                    <SelectItem value="Intermediate">{t("intermediate")}</SelectItem>
                    <SelectItem value="Advanced">{t("advanced")}</SelectItem>
                    <SelectItem value="Expert">{t("expert")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-foreground">{t("videoFile")}</h3>

              {videoFormEntries.map((video, index) => (
                <div key={index} className="space-y-3 rounded-lg border border-border p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {video.video_type === 'youtube' ? 'YouTube' : t("videoFile")} {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVideoEntry(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {video.video_type === 'youtube' ? (
                    <div className="space-y-2">
                      <Label>{t("youtubeUrl")}</Label>
                      <Input
                        type="url"
                        value={video.url}
                        onChange={(e) => updateVideoEntry(index, e.target.value)}
                        placeholder={t("youtubePlaceholder")}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>{t("videoFile")}</Label>
                      {videoFiles[index] ? (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                          <span className="text-sm text-foreground truncate flex-1">
                            {videoFiles[index]?.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newFiles = { ...videoFiles }
                              delete newFiles[index]
                              setVideoFiles(newFiles)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : video.url ? (
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                          <span className="text-sm text-foreground truncate flex-1">
                            {t("videoUploaded")}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateVideoEntry(index, "")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            id={`edit-video-file-${index}`}
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const MAX_SIZE = 100 * 1024 * 1024
                                if (file.size > MAX_SIZE) {
                                  toast({
                                    title: t("toastError"),
                                    description: t("toastVideoTooLarge"),
                                    variant: "destructive",
                                  })
                                  e.target.value = ""
                                  return
                                }
                                setVideoFiles({ ...videoFiles, [index]: file })
                              }
                            }}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById(`edit-video-file-${index}`)?.click()}
                            className="w-full"
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            {t("selectVideo")}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addVideoEntry('youtube')}
                  className="flex-1 bg-transparent"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {t("addYoutubeVideo")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addVideoEntry('uploaded')}
                  className="flex-1 bg-transparent"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {t("addVideoFile")}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-foreground">{t("musicTracks")}</h3>

            {musicEntries.map((music, index) => (
              <div key={index} className="space-y-3 rounded-lg border border-border p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Track {index + 1}</span>
                  {musicEntries.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeMusicEntry(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                {/* Only show title field when there are multiple tracks */}
                {showTitleFields && (
                  <div className="space-y-2">
                    <Label>{t("title")} *</Label>
                    <Input
                      value={music.title}
                      onChange={(e) => updateMusicEntry(index, "title", e.target.value)}
                      placeholder={t("titlePlaceholder")}
                      required={!!musicAudioFiles[index] || !!music.audio_url}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{t("audio")}</Label>
                  {musicAudioFiles[index] ? (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <span className="text-sm text-foreground truncate flex-1">
                        {musicAudioFiles[index]?.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newFiles = { ...musicAudioFiles }
                          delete newFiles[index]
                          setMusicAudioFiles(newFiles)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : music.audio_url ? (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <span className="text-sm text-foreground truncate flex-1">
                        {t("audioUploaded")}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = [...musicEntries]
                          updated[index].audio_url = ""
                          setMusicEntries(updated)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        id={`music-audio-${index}`}
                        type="file"
                        accept="audio/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const MAX_SIZE = 20 * 1024 * 1024
                            if (file.size > MAX_SIZE) {
                              toast({
                                title: t("toastError"),
                                description: t("toastAudioTooLarge"),
                                variant: "destructive",
                              })
                              e.target.value = ""
                              return
                            }
                            setMusicAudioFiles({ ...musicAudioFiles, [index]: file })
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById(`music-audio-${index}`)?.click()}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {t("selectAudio")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addMusicEntry} className="w-full bg-transparent">
              <Plus className="mr-1 h-3 w-3" />
              {t("addMusicTrack")}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading || uploading || (!nameDe.trim() && !nameRu.trim())}>
              {uploading ? t("uploading") : loading ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
