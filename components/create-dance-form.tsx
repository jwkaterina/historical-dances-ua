"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Upload, X } from "lucide-react"
import Link from "next/link"

interface MusicEntry {
  title: string
  artist: string
  tempo: string
  genre: string
  audio_url?: string
}

export function CreateDanceForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t, language } = useLanguage()
  const { isAdmin, isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  // German fields
  const [nameDe, setNameDe] = useState("")
  const [descriptionDe, setDescriptionDe] = useState("")
  const [schemeDe, setSchemeDe] = useState("")
  
  // Russian fields
  const [nameRu, setNameRu] = useState("")
  const [descriptionRu, setDescriptionRu] = useState("")
  const [schemeRu, setSchemeRu] = useState("")
  
  // Common fields
  const [difficulty, setDifficulty] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [origin, setOrigin] = useState("") // Declared the missing variable
  
  const [musicEntries, setMusicEntries] = useState<MusicEntry[]>([
    { title: "", artist: "", tempo: "", genre: "", audio_url: "" }
  ])
  const [musicAudioFiles, setMusicAudioFiles] = useState<Record<number, File | null>>({})

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

  const updateMusicEntry = (index: number, field: keyof MusicEntry, value: string) => {
    const updated = [...musicEntries]
    updated[index][field] = value
    setMusicEntries(updated)
  }

  const handleVideoUpload = async (file: File): Promise<string | null> => {
    setUploading(true)
    try {
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

  const resetForm = () => {
    setNameDe("")
    setDescriptionDe("")
    setSchemeDe("")
    setNameRu("")
    setDescriptionRu("")
    setSchemeRu("")
    setDifficulty("")
    setOrigin("")
    setYoutubeUrl("")
    setVideoFile(null)
    setMusicEntries([{ title: "", artist: "", tempo: "", genre: "", audio_url: "" }])
    setMusicAudioFiles({})
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
      const supabase = createClient()

      // Upload video file if present
      let finalVideoUrl = ""
      if (videoFile) {
        const uploadedUrl = await handleVideoUpload(videoFile)
        if (uploadedUrl) {
          finalVideoUrl = uploadedUrl
        }
      }

      // Use German name as the base name
      const { data: dance, error: danceError } = await supabase
        .from("dances")
        .insert({
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
          youtube_url: youtubeUrl || null,
          video_url: finalVideoUrl || null,
          origin: origin || null // Added origin field
        })
        .select()
        .single()

      if (danceError) throw danceError

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

      // Create music entries and link them
      // Filter to only tracks that have audio files
      const validMusic = musicEntriesWithAudio.filter((m, i) => 
        m.audio_url || musicAudioFiles[i]
      )
      
      for (const music of validMusic) {
        // If only one track with audio, use dance name as title; otherwise use the entered title
        const musicTitle = validMusic.length > 1 ? music.title : danceName
        
        const { data: musicData, error: musicError } = await supabase
          .from("music")
          .insert({
            title: musicTitle,
            artist: music.artist || null,
            tempo: music.tempo ? parseInt(music.tempo) : null,
            genre: music.genre || null,
            audio_url: music.audio_url || null,
          })
          .select()
          .single()

        if (musicError) throw musicError

        const { error: linkError } = await supabase
          .from("dance_music")
          .insert({
            dance_id: dance.id,
            music_id: musicData.id,
          })

        if (linkError) throw linkError
      }

      resetForm()
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating dance:", error)
    } finally {
      setLoading(false)
    }
  }

  // Only show for admins
  if (authLoading || !isAdmin) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
        if (newOpen) {
          // Reset form when dialog opens to ensure clean state
          resetForm()
        }
        setOpen(newOpen)
      }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("createDance")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl pb-20 sm:pb-6">
        <DialogHeader>
          <DialogTitle>{t("addNewDance")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nameRu">{t("danceName")} (Русский) *</Label>
              <Input
                id="nameRu"
                value={nameRu}
                onChange={(e) => setNameRu(e.target.value)}
                placeholder={t("danceNamePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameDe">{t("danceName")} (Deutsch) *</Label>
              <Input
                id="nameDe"
                value={nameDe}
                onChange={(e) => setNameDe(e.target.value)}
                placeholder={t("danceNamePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionRu">{t("descriptionLabel")} (Русский)</Label>
              <Textarea
                id="descriptionRu"
                value={descriptionRu}
                onChange={(e) => setDescriptionRu(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionDe">{t("descriptionLabel")} (Deutsch)</Label>
              <Textarea
                id="descriptionDe"
                value={descriptionDe}
                onChange={(e) => setDescriptionDe(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schemeRu">{t("schemeLabel")} (Русский)</Label>
              <Textarea
                id="schemeRu"
                value={schemeRu}
                onChange={(e) => setSchemeRu(e.target.value)}
                placeholder={t("schemePlaceholder")}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schemeDe">{t("schemeLabel")} (Deutsch)</Label>
              <Textarea
                id="schemeDe"
                value={schemeDe}
                onChange={(e) => setSchemeDe(e.target.value)}
                placeholder={t("schemePlaceholder")}
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="difficulty">{t("difficulty")}</Label>
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

              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">{t("youtubeUrl")}</Label>
                <Input
                  id="youtubeUrl"
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder={t("youtubePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("videoFile")}</Label>
                {videoFile ? (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <span className="text-sm text-foreground truncate flex-1">
                      {videoFile.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setVideoFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      id="videoFile"
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setVideoFile(file)
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("videoFile")?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t("selectVideo")}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-foreground">{t("musicTracks")}</h3>

              {musicEntries.map((music, index) => (
                <div key={index} className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Track {index + 1}</span>
                    {musicEntries.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMusicEntry(index)}
                      >
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
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          id={`create-music-audio-${index}`}
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
                          onClick={() => document.getElementById(`create-music-audio-${index}`)?.click()}
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

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={loading || uploading || (!nameDe.trim() && !nameRu.trim())}>
                {uploading ? t("uploading") : loading ? t("creating") : t("create")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
