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
// removed unused Tabs import
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Upload, X } from "lucide-react"
// removed unused Link import

interface MusicEntry {
  title: string
  artist: string
  tempo: string
  genre: string
  audio_url?: string
}

interface VideoEntry {
  video_type: 'youtube' | 'uploaded'
  url: string
}

interface FigureVideoFormEntry {
  video_type: 'youtube' | 'uploaded'
  url: string
}

interface FigureFormEntry {
  scheme_ua: string
  scheme_ru: string
  videos: FigureVideoFormEntry[]
}

export function CreateDanceForm() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t, language } = useLanguage()
  const { isAdmin, loading: authLoading } = useAuth()
  const { toast } = useToast()
  
  // German fields
  const [nameUa, setNameUa] = useState("")
  const [descriptionUa, setDescriptionUa] = useState("")
  const [schemeUa, setSchemeUa] = useState("")
  
  // Russian fields
  const [nameRu, setNameRu] = useState("")
  const [descriptionRu, setDescriptionRu] = useState("")
  const [schemeRu, setSchemeRu] = useState("")
  
  // Common fields
  const [difficulty, setDifficulty] = useState("")
  const [uploading, setUploading] = useState(false)
  const [origin, setOrigin] = useState("")
  const [selectedTutorialIds, setSelectedTutorialIds] = useState<string[]>([])
  const [availableTutorials, setAvailableTutorials] = useState<{ id: string; title_ua: string; title_ru: string }[]>([])
  const [tutorialSearch, setTutorialSearch] = useState("")
  const [tutorialDropdownOpen, setTutorialDropdownOpen] = useState(false)

  const [musicEntries, setMusicEntries] = useState<MusicEntry[]>([
    { title: "", artist: "", tempo: "", genre: "", audio_url: "" }
  ])
  const [musicAudioFiles, setMusicAudioFiles] = useState<Record<number, File | null>>({})

  // Video entries state
  const [videoEntries, setVideoEntries] = useState<VideoEntry[]>([])
  const [videoFiles, setVideoFiles] = useState<Record<number, File | null>>({})

  // Figure entries state
  const [figureEntries, setFigureEntries] = useState<FigureFormEntry[]>([])
  const [figureVideoFiles, setFigureVideoFiles] = useState<Record<string, Record<number, File | null>>>({})
  const [openFigures, setOpenFigures] = useState<Record<number, boolean>>({})

  const toggleFigure = (index: number) => {
    setOpenFigures(prev => ({ ...prev, [index]: !prev[index] }))
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

  const updateMusicEntry = (index: number, field: keyof MusicEntry, value: string) => {
    const updated = [...musicEntries]
    updated[index][field] = value
    setMusicEntries(updated)
  }

  // Video entry functions
  const addVideoEntry = (type: 'youtube' | 'uploaded') => {
    setVideoEntries([...videoEntries, { video_type: type, url: "" }])
  }

  const removeVideoEntry = (index: number) => {
    setVideoEntries(videoEntries.filter((_, i) => i !== index))
    const newVideoFiles = { ...videoFiles }
    delete newVideoFiles[index]
    setVideoFiles(newVideoFiles)
  }

  const updateVideoEntry = (index: number, url: string) => {
    const updated = [...videoEntries]
    updated[index].url = url
    setVideoEntries(updated)
  }

  // Figure entry functions
  const addFigure = () => {
    setFigureEntries([...figureEntries, { scheme_ua: '', scheme_ru: '', videos: [] }])
  }

  const removeFigure = (index: number) => {
    setFigureEntries(figureEntries.filter((_, i) => i !== index))
    const newFigureVideoFiles = { ...figureVideoFiles }
    delete newFigureVideoFiles[index.toString()]
    setFigureVideoFiles(newFigureVideoFiles)
  }

  const updateFigureScheme = (index: number, lang: 'ua' | 'ru', value: string) => {
    const updated = [...figureEntries]
    if (lang === 'ua') {
      updated[index].scheme_ua = value
    } else {
      updated[index].scheme_ru = value
    }
    setFigureEntries(updated)
  }

  const addFigureVideo = (figureIndex: number, type: 'youtube' | 'uploaded') => {
    const updated = [...figureEntries]
    updated[figureIndex].videos.push({ video_type: type, url: '' })
    setFigureEntries(updated)
  }

  const removeFigureVideo = (figureIndex: number, videoIndex: number) => {
    const updated = [...figureEntries]
    updated[figureIndex].videos = updated[figureIndex].videos.filter((_, i) => i !== videoIndex)
    setFigureEntries(updated)

    const figureKey = figureIndex.toString()
    if (figureVideoFiles[figureKey]) {
      const newFigureFiles = { ...figureVideoFiles[figureKey] }
      delete newFigureFiles[videoIndex]
      setFigureVideoFiles({ ...figureVideoFiles, [figureKey]: newFigureFiles })
    }
  }

  const updateFigureVideoUrl = (figureIndex: number, videoIndex: number, url: string) => {
    const updated = [...figureEntries]
    updated[figureIndex].videos[videoIndex].url = url
    setFigureEntries(updated)
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
    setNameUa("")
    setDescriptionUa("")
    setSchemeUa("")
    setNameRu("")
    setDescriptionRu("")
    setSchemeRu("")
    setDifficulty("")
    setOrigin("")
    setSelectedTutorialIds([])
    setTutorialSearch("")
    setTutorialDropdownOpen(false)
    setMusicEntries([{ title: "", artist: "", tempo: "", genre: "", audio_url: "" }])
    setMusicAudioFiles({})
    setVideoEntries([])
    setVideoFiles({})
    setFigureEntries([])
    setFigureVideoFiles({})
    setOpenFigures({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that both language names are provided
    if (!nameUa.trim() || !nameRu.trim()) {
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

      // Use German name as the base name
      const { data: dance, error: danceError } = await supabase
        .from("dances")
        .insert({
          name: nameUa || nameRu,
          name_ua: nameUa || null,
          name_ru: nameRu || null,
          description: descriptionUa || descriptionRu || null,
          description_ua: descriptionUa || null,
          description_ru: descriptionRu || null,
          scheme: schemeUa || schemeRu || null,
          scheme_ua: schemeUa || null,
          scheme_ru: schemeRu || null,
          difficulty: difficulty || null,
          origin: origin || null,
        })
        .select()
        .single()

      if (danceError) throw danceError

      // Link selected tutorials
      if (selectedTutorialIds.length > 0) {
        await supabase.from('dance_tutorials').insert(
          selectedTutorialIds.map(tid => ({ dance_id: dance.id, tutorial_id: tid }))
        )
      }

      // Process and insert video entries
      for (let i = 0; i < videoEntries.length; i++) {
        const video = videoEntries[i]
        let url = video.url

        // Upload file if needed
        if (video.video_type === 'uploaded' && videoFiles[i]) {
          const uploadedUrl = await handleVideoUpload(videoFiles[i]!)
          if (uploadedUrl) {
            url = uploadedUrl
          }
        }

        // Only insert if URL is valid
        if (url && url.trim() !== '') {
          const { error: videoError } = await supabase
            .from("dance_videos")
            .insert({
              dance_id: dance.id,
              video_type: video.video_type,
              url: url,
              order_index: i,
            })

          if (videoError) throw videoError
        }
      }

      // Process and insert figure entries
      for (let i = 0; i < figureEntries.length; i++) {
        const figure = figureEntries[i]

        // Insert figure
        const { data: figureData, error: figureError } = await supabase
          .from("dance_figures")
          .insert({
            dance_id: dance.id,
            scheme_ua: figure.scheme_ua || null,
            scheme_ru: figure.scheme_ru || null,
            order_index: i,
          })
          .select()
          .single()

        if (figureError) throw figureError

        // Insert figure videos
        for (let j = 0; j < figure.videos.length; j++) {
          const video = figure.videos[j]
          let url = video.url

          // Upload file if needed
          const figureKey = i.toString()
          if (video.video_type === 'uploaded' && figureVideoFiles[figureKey]?.[j]) {
            const uploadedUrl = await handleVideoUpload(figureVideoFiles[figureKey][j]!)
            if (uploadedUrl) {
              url = uploadedUrl
            }
          }

          // Only insert if URL is valid
          if (url && url.trim() !== '') {
            const { error: videoError } = await supabase
              .from("figure_videos")
              .insert({
                figure_id: figureData.id,
                video_type: video.video_type,
                url: url,
                order_index: j,
              })

            if (videoError) throw videoError
          }
        }
      }

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
      const danceName = language === "ru" ? (nameRu || nameUa) : (nameUa || nameRu)

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

  const fetchTutorials = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('tutorials').select('id, title_ua, title_ru').order('title_ua')
    if (data) setAvailableTutorials(data)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
        if (newOpen) {
          resetForm()
          fetchTutorials()
        }
        setOpen(newOpen)
      }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("createDance")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:max-w-2xl px-3 sm:px-6 pb-24 sm:pb-6">
        <DialogHeader>
          <DialogTitle>{t("createDance")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Name and text fields */}
            <div className="space-y-2">
              <Label htmlFor="nameRu">{t("danceName")} (Русский) *</Label>
              <Input id="nameRu" value={nameRu} onChange={(e) => setNameRu(e.target.value)} placeholder={t("danceNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameUa">{t("danceName")} (Українська) *</Label>
              <Input id="nameUa" value={nameUa} onChange={(e) => setNameUa(e.target.value)} placeholder={t("danceNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionRu">{t("descriptionLabel")} (Русский)</Label>
              <Textarea id="descriptionRu" value={descriptionRu} onChange={(e) => setDescriptionRu(e.target.value)} placeholder={t("descriptionPlaceholder")} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionUa">{t("descriptionLabel")} (Українська)</Label>
              <Textarea id="descriptionUa" value={descriptionUa} onChange={(e) => setDescriptionUa(e.target.value)} placeholder={t("descriptionPlaceholder")} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schemeRu">{t("schemeLabel")} (Русский)</Label>
              <Textarea id="schemeRu" value={schemeRu} onChange={(e) => setSchemeRu(e.target.value)} placeholder={t("schemePlaceholder")} rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schemeUa">{t("schemeLabel")} (Українська)</Label>
              <Textarea id="schemeUa" value={schemeUa} onChange={(e) => setSchemeUa(e.target.value)} placeholder={t("schemePlaceholder")} rows={4} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-foreground">{t("figures")}</h3>

            {figureEntries.map((figure, figureIndex) => {
              const isOpen = openFigures[figureIndex] ?? false
              return (
                <div key={figureIndex} className="rounded-lg border border-border">
                  <div className="flex items-center justify-between p-3">
                    <button
                      type="button"
                      className="flex items-center gap-2 flex-1 text-left"
                      onClick={() => toggleFigure(figureIndex)}
                    >
                      <span className="text-sm font-medium text-foreground">
                        {t("figure")} {figureIndex + 1}
                      </span>
                      <span className="text-muted-foreground text-sm">{isOpen ? '−' : '+'}</span>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFigure(figureIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {isOpen && (
                    <div className="space-y-4 px-3 pb-3">

                <div className="space-y-2">
                  <Label>{t("schemeLabel")} (Русский)</Label>
                  <Textarea
                    value={figure.scheme_ru}
                    onChange={(e) => updateFigureScheme(figureIndex, 'ru', e.target.value)}
                    placeholder={t("schemePlaceholder")}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("schemeLabel")} (Українська)</Label>
                  <Textarea
                    value={figure.scheme_ua}
                    onChange={(e) => updateFigureScheme(figureIndex, 'ua', e.target.value)}
                    placeholder={t("schemePlaceholder")}
                    rows={3}
                  />
                </div>

                {figure.videos.length > 0 && (
                  <div className="space-y-3 mt-3">
                    <Label className="text-sm text-muted-foreground">{t("videoFile")}</Label>
                    {figure.videos.map((video, videoIndex) => (
                      <div key={videoIndex} className="space-y-2 rounded border border-border/50 p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {video.video_type === 'youtube' ? 'YouTube' : t("videoFile")} {videoIndex + 1}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFigureVideo(figureIndex, videoIndex)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>

                        {video.video_type === 'youtube' ? (
                          <div className="space-y-1">
                            <Input
                              type="url"
                              value={video.url}
                              onChange={(e) => updateFigureVideoUrl(figureIndex, videoIndex, e.target.value)}
                              placeholder={t("youtubePlaceholder")}
                              className="text-sm"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {figureVideoFiles[figureIndex.toString()]?.[videoIndex] ? (
                              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                <span className="text-xs text-foreground truncate flex-1">
                                  {figureVideoFiles[figureIndex.toString()][videoIndex]?.name}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const figureKey = figureIndex.toString()
                                    const newFiles = { ...figureVideoFiles[figureKey] }
                                    delete newFiles[videoIndex]
                                    setFigureVideoFiles({ ...figureVideoFiles, [figureKey]: newFiles })
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Input
                                  id={`create-figure-${figureIndex}-video-${videoIndex}`}
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
                                      const figureKey = figureIndex.toString()
                                      setFigureVideoFiles({
                                        ...figureVideoFiles,
                                        [figureKey]: { ...figureVideoFiles[figureKey], [videoIndex]: file }
                                      })
                                    }
                                  }}
                                  className="hidden"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => document.getElementById(`create-figure-${figureIndex}-video-${videoIndex}`)?.click()}
                                  className="w-full text-xs"
                                >
                                  <Upload className="mr-1 h-3 w-3" />
                                  {t("selectVideo")}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addFigureVideo(figureIndex, 'youtube')}
                          className="flex-1 bg-transparent text-xs"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          {t("addYoutubeVideo")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addFigureVideo(figureIndex, 'uploaded')}
                          className="flex-1 bg-transparent text-xs"
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          {t("addVideoFile")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFigure}
              className="w-full bg-transparent"
            >
              <Plus className="mr-1 h-3 w-3" />
              {t("addFigure")}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
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
            </div>

            <div className="space-y-2">
              <Label>{t("linkedTutorials")}</Label>
              <div className="relative">
                <Input
                  value={tutorialSearch}
                  onChange={(e) => setTutorialSearch(e.target.value)}
                  placeholder={t("searchTutorialsInForm")}
                  onFocus={() => setTutorialDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setTutorialDropdownOpen(false), 150)}
                />
                {tutorialDropdownOpen && (() => {
                  const options = availableTutorials.filter(tut => {
                    const title = language === 'ru' ? tut.title_ru : tut.title_ua
                    return !selectedTutorialIds.includes(tut.id) &&
                      (!tutorialSearch || title.toLowerCase().includes(tutorialSearch.toLowerCase()))
                  })
                  if (options.length === 0) return null
                  return (
                    <div className="absolute z-10 w-full mt-1 border rounded-md bg-popover shadow-md max-h-40 overflow-y-auto">
                      {options.map(tut => {
                        const title = language === 'ru' ? tut.title_ru : tut.title_ua
                        return (
                          <button
                            key={tut.id}
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                            onClick={() => { setSelectedTutorialIds([...selectedTutorialIds, tut.id]); setTutorialSearch(""); setTutorialDropdownOpen(false) }}
                          >
                            {title}
                          </button>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
              {selectedTutorialIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedTutorialIds.map(id => {
                    const tut = availableTutorials.find(t => t.id === id)
                    if (!tut) return null
                    const title = language === 'ru' ? tut.title_ru : tut.title_ua
                    return (
                      <span key={id} className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground rounded px-2 py-0.5 text-xs">
                        {title}
                        <button type="button" onClick={() => setSelectedTutorialIds(selectedTutorialIds.filter(tid => tid !== id))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-foreground">{t("videoFile")}</h3>

              {videoEntries.map((video, index) => (
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
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            id={`create-video-file-${index}`}
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
                            onClick={() => document.getElementById(`create-video-file-${index}`)?.click()}
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
                      <Input value={music.title} onChange={(e) => updateMusicEntry(index, "title", e.target.value)} placeholder={t("titlePlaceholder")} required={!!musicAudioFiles[index] || !!music.audio_url} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>{t("audio")}</Label>
                    {musicAudioFiles[index] ? (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                        <span className="text-sm text-foreground truncate flex-1">{musicAudioFiles[index]?.name}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => { const newFiles = { ...musicAudioFiles }; delete newFiles[index]; setMusicAudioFiles(newFiles) }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input id={`create-music-audio-${index}`} type="file" accept="audio/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const MAX_SIZE = 20 * 1024 * 1024; if (file.size > MAX_SIZE) { toast({ title: t("toastError"), description: t("toastAudioTooLarge"), variant: "destructive", }); e.target.value = ""; return } setMusicAudioFiles({ ...musicAudioFiles, [index]: file }) } }} className="hidden" />
                        <Button type="button" variant="outline" onClick={() => document.getElementById(`create-music-audio-${index}`)?.click()} className="w-full">
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
              <Button type="submit" disabled={loading || uploading || (!nameUa.trim() && !nameRu.trim())}>
                {uploading ? t("uploading") : loading ? t("creating") : t("create")}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
