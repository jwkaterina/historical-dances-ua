"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Plus, Trash2 } from "lucide-react"
import DanceSelector from "@/components/ui/dance-selector"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { createBall, updateBall } from "@/app/actions/ball"
import { useLanguage } from "@/hooks/use-language" // Declare the useLanguage variable

interface MusicTrack {
  id: string
  title: string
  artist: string | null
  audio_url: string | null
}

interface Dance {
  id: string
  name: string
  name_de: string | null
  name_ru: string | null
  difficulty: string | null
  musicTracks?: MusicTrack[]
}

interface SectionDanceEntry {
  danceId: string
  musicId?: string | null
}

interface Section {
  id?: string
  name: string
  name_de: string
  name_ru: string
  dances: SectionDanceEntry[]
}

interface CreateBallFormProps {
  dances: Dance[]
  ballToEdit?: any
}

export function CreateBallForm({ dances, ballToEdit }: CreateBallFormProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  // Transform ballToEdit.ball_sections to the format expected by the form
  const initialSections = useMemo(() => {
    if (ballToEdit?.ball_sections && ballToEdit.ball_sections.length > 0) {
      return ballToEdit.ball_sections
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((section: any) => ({
          id: section.id,
          name: section.name || "",
          name_de: section.name_de || "",
          name_ru: section.name_ru || "",
          dances: (section.section_dances || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((sd: any) => ({
              danceId: sd.dances?.id || sd.dance_id,
              musicId: sd.music_id || null
            }))
        }))
    }
    return [{ id: undefined, name: "", name_de: "", name_ru: "", dances: [] }]
  }, [ballToEdit])

  const [nameDE, setNameDE] = useState(ballToEdit?.name_de || "")
  const [nameRU, setNameRU] = useState(ballToEdit?.name_ru || "")
  const [date, setDate] = useState(ballToEdit?.date || "")
  const [selectedCityDE, setSelectedCityDE] = useState(ballToEdit?.place_de || "")
  const [selectedCityRU, setSelectedCityRU] = useState(ballToEdit?.place_ru || "")
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [danceSearch, setDanceSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState(0)
  const [dragOverTarget, setDragOverTarget] = useState<{ sectionIndex: number; danceIndex: number } | null>(null)

  const [trackPickerOpen, setTrackPickerOpen] = useState<Record<string, boolean>>({})
  const [tracksByDance, setTracksByDance] = useState<Record<string, MusicTrack[]>>({})
  const [tracksLoading, setTracksLoading] = useState<Record<string, boolean>>({})
  const [tracksError, setTracksError] = useState<Record<string, string | null>>({})

  if (!isAdmin) {
    return null
  }

  const filteredDances = dances.filter((dance) => {
    const displayName = language === "ru"
      ? (dance.name_ru || dance.name)
      : (dance.name_de || dance.name)
    return displayName.toLowerCase().includes(danceSearch.toLowerCase())
  })

  function closeAllTrackPickers() {
    setTrackPickerOpen({})
  }

// 1) Provide a proper string-key wrapper for DanceSelector
  const tStr: (key: string) => string = (key: string) => t(key as any)

// 2) Harden ensureTracksLoaded against undefined danceId
  async function ensureTracksLoaded(danceId?: string) {
    if (!danceId) return
    if (tracksByDance[danceId] && !tracksLoading[danceId]) return
    try {
      setTracksLoading(prev => ({ ...prev, [danceId]: true }))
      setTracksError(prev => ({ ...prev, [danceId]: null }))
      const res = await fetch(`/api/music-tracks?danceId=${encodeURIComponent(danceId)}`, { cache: "no-store" })
      if (!res.ok) throw new Error(`Failed to load tracks (${res.status})`)
      const data: MusicTrack[] = await res.json()
      setTracksByDance(prev => ({ ...prev, [danceId]: data }))
    } catch (err) {
      setTracksError(prev => ({ ...prev, [danceId]: (err as Error).message }))
      setTracksByDance(prev => ({ ...prev, [danceId]: [] }))
    } finally {
      setTracksLoading(prev => ({ ...prev, [danceId]: false }))
    }
  }

// 3) Require and use danceId in toggleTrackPicker
  async function toggleTrackPicker(sectionIndex: number, danceIndex: number, danceId?: string) {
    if (!danceId) {
      // optional: show toast to indicate missing dance id
      toast({ title: t("error"), description: t("noTracksAvailable") })
      return
    }
    const key = `${sectionIndex}:${danceIndex}`
    setTrackPickerOpen(prev => ({ ...prev, [key]: true }))

    await ensureTracksLoaded(danceId)
  }

  const addSection = () => {
    setSections([
      ...sections,
      { id: undefined, name: "", name_de: "", name_ru: "", dances: [] }
    ])
    setActiveSection(sections.length)
  }

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index))
    if (activeSection >= sections.length - 1) {
      setActiveSection(Math.max(0, sections.length - 2))
    }
  }

  const updateSection = (index: number, field: string, value: any) => {
    const newSections = [...sections]
    newSections[index] = { ...newSections[index], [field]: value }
    setSections(newSections)
  }

  const addDanceToSection = (sectionIndex: number, danceId: string) => {
    const dance = dances.find(d => d.id === danceId)
    const currentDances = sections[sectionIndex].dances
    
    // Check if dance is already in section
    if (currentDances.some(d => d.danceId === danceId)) {
      return
    }
    
    // If dance has exactly one music track, auto-assign it
    // Otherwise, leave music_id as null for user selection
    const musicId = dance?.musicTracks?.length === 1 ? dance.musicTracks[0].id : null
    
    updateSection(sectionIndex, "dances", [
      ...currentDances,
      { danceId, musicId }
    ])
  }

  const updateDanceMusicInSection = (sectionIndex: number, danceIndex: number, musicId: string | null) => {
    const currentDances = [...sections[sectionIndex].dances]
    currentDances[danceIndex] = { ...currentDances[danceIndex], musicId }
    updateSection(sectionIndex, "dances", currentDances)
  }

  const removeDanceFromSection = (sectionIndex: number, danceIndex: number) => {
    const currentDances = sections[sectionIndex].dances
    updateSection(sectionIndex, "dances", currentDances.filter((_, i) => i !== danceIndex))
  }

  const handleDragStart = (sectionIndex: number, danceIndex: number) => (e: React.DragEvent) => {
    closeAllTrackPickers()
    e.dataTransfer.setData("application/json", JSON.stringify({ fromSection: sectionIndex, fromIndex: danceIndex }))
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (sectionIndex: number, danceIndex: number) => (e: React.DragEvent) => {
    e.preventDefault() // allow drop
    e.dataTransfer.dropEffect = "move"
    setDragOverTarget({ sectionIndex, danceIndex })
  }

  const handleDropOnDance = (sectionIndex: number, danceIndex: number) => (e: React.DragEvent) => {
    e.preventDefault()
    const payload = e.dataTransfer.getData("application/json")
    if (!payload) return
    const { fromSection, fromIndex } = JSON.parse(payload) as { fromSection: number; fromIndex: number }

    setSections(prev => {
      const next = prev.map(s => ({ ...s, dances: [...s.dances] }))
      const [moved] = next[fromSection].dances.splice(fromIndex, 1)

      // insert before the target danceIndex in destination section
      const insertIndex = danceIndex + (fromSection === sectionIndex && fromIndex < danceIndex ? 0 : 0)
      next[sectionIndex].dances.splice(insertIndex, 0, moved)
      return next
    })
    setDragOverTarget(null)
  }

  const handleDragLeave = () => setDragOverTarget(null)

  const resetForm = () => {
    setNameDE(ballToEdit?.name_de || "")
    setNameRU(ballToEdit?.name_ru || "")
    setDate(ballToEdit?.date || "")
    setSelectedCityDE(ballToEdit?.place_de || "")
    setSelectedCityRU(ballToEdit?.place_ru || "")
    setSections(initialSections)
    setDanceSearch("")
    setActiveSection(0)
    closeAllTrackPickers()
  }

  const handleSubmit = async () => {
    // Only require basic ball info: name in both languages, date, and cities
    if (!nameDE || !nameRU || !date || !selectedCityDE || !selectedCityRU) {
      toast({
        title: t("error"),
        description: t("fillAllFields"),
        variant: "destructive",
      })
      return
    }

    // Filter out empty sections (sections with no dances)
    const filledSections = sections.filter(s => s.dances.length > 0)

    setLoading(true)
    try {
      const ballData = {
        name: nameDE, // Use German name as default
        name_de: nameDE,
        name_ru: nameRU,
        date,
        place_de: selectedCityDE,
        place_ru: selectedCityRU,
        sections: filledSections.map((s, idx) => ({
          id: s.id,
          name: `Section ${idx + 1}`,
          name_de: `Abteilung ${idx + 1}`,
          name_ru: `Отделение ${idx + 1}`,
          dances: s.dances,
        })),
      }

      if (ballToEdit?.id) {
        await updateBall(ballToEdit.id, ballData)
        toast({
          title: t("success"),
          description: t("ballUpdated"),
        })
      } else {
        await createBall(ballData)
        toast({
          title: t("success"),
          description: t("ballCreated"),
        })
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        title: t("error"),
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (newOpen) {
          resetForm()
        }
        setOpen(newOpen)
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Edit className="mr-2 h-4 w-4" /> {/* Declare the Edit component */}
          {ballToEdit ? t("editBall") : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              {t("createBall")}
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl pb-20 sm:pb-6">

        <DialogHeader>
          <DialogTitle>{ballToEdit ? t("editBall") : t("createBall")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name-ru">{language === "ru" ? "Название бала" : t("ballName")} (Русский)</Label>
            <Input
              id="name-ru"
              value={nameRU}
              onChange={(e) => setNameRU(e.target.value)}
              placeholder="напр. Новогодний бал"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name-de">{language === "ru" ? t("ballName") : "Ballname"} (Deutsch)</Label>
            <Input
              id="name-de"
              value={nameDE}
              onChange={(e) => setNameDE(e.target.value)}
              placeholder="z.B. Silvesterball"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">{t("ballDate")}</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city-ru">{language === "ru" ? "Город" : "Stadt"} (Русский)</Label>
            <Input
              id="city-ru"
              value={selectedCityRU}
              onChange={(e) => setSelectedCityRU(e.target.value)}
              placeholder="напр. Москва"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city-de">{language === "ru" ? "Город" : "Stadt"} (Deutsch)</Label>
            <Input
              id="city-de"
              value={selectedCityDE}
              onChange={(e) => setSelectedCityDE(e.target.value)}
              placeholder="z.B. Berlin"
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label>{t("sections")}</Label>
          {sections.map((section, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{t("section")} {index + 1}</h3>
                {sections.length > 1 && (
                  <button
                    onClick={() => removeSection(index)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {section.dances.map((entry, danceIndex) => {
                  const dance = dances.find(d => d.id === entry.danceId)
                  const pickerKey = `${index}:${danceIndex}`
                  const isPickerOpen = !!trackPickerOpen[pickerKey]

                  const tracks = tracksByDance[entry.danceId] || []
                  const isLoadingTracks = !!tracksLoading[entry.danceId]
                  const loadError = tracksError[entry.danceId]

                  return (
                    <div
                      key={danceIndex}
                      className={`border rounded-md p-3 bg-muted/30 ${dragOverTarget && dragOverTarget.sectionIndex === index && dragOverTarget.danceIndex === danceIndex ? 'ring-2 ring-primary/40' : ''}`}
                      draggable
                      onDragStart={handleDragStart(index, danceIndex)}
                      onDragOver={handleDragOver(index, danceIndex)}
                      onDrop={handleDropOnDance(index, danceIndex)}
                      onDragLeave={handleDragLeave}
                    >
                      <div className="flex items-center gap-2">
                          <div
                              className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                            {danceIndex + 1}
                          </div>
                          <div className="flex-1 text-sm font-medium">
                            {language === "ru"
                                ? (dance?.name_ru || dance?.name)
                                : (dance?.name_de || dance?.name)}
                          </div>
                          <button
                              type="button"
                              onClick={() => toggleTrackPicker(index, danceIndex, entry.danceId)}
                              className="text-xs px-2 py-1 rounded border hover:bg-accent/20 disabled:opacity-50"
                              aria-expanded={isPickerOpen}
                              aria-controls={`track-picker-${index}-${danceIndex}`}
                              aria-busy={isLoadingTracks}
                          >
                            {isLoadingTracks ? t("loading") : t("selectTrack")}
                          </button>
                          <button
                              onClick={() => removeDanceFromSection(index, danceIndex)}
                              className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4"/>
                          </button>
                        </div>

                        {/* Dropdown is visible only when button toggled */}
                        {isPickerOpen && (
                          <div id={`track-picker-${index}-${danceIndex}`} className="mt-2 ml-10">

                            {!isLoadingTracks && loadError && (
                                <div className="text-xs text-destructive">{loadError}</div>
                            )}
                              {!isLoadingTracks && !loadError && (
                                <>
                                  {tracks.length === 0 ? (
                                    <div className="text-xs text-muted-foreground italic">
                                      {tStr("noTracksAvailable")}
                                    </div>
                                  ) : (
                                    <select
                                        value={entry.musicId || ""}
                                        onChange={(e) =>
                                            updateDanceMusicInSection(index, danceIndex, e.target.value || null)
                                        }
                                        className="w-full text-sm border rounded px-2 py-1 bg-background"
                                    >
                                      <option value="">{t("chooseLater")}</option>
                                      {tracks.map((track) => (
                                          <option key={track.id} value={track.id}>
                                            {track.title}{track.artist ? ` - ${track.artist}` : ""}
                                          </option>
                                      ))}
                                    </select>
                                  )}
                                </>
                              )}
                            </div>
                        )}
                      </div>
                  )
                })}

                <DanceSelector
                  sectionDances={section.dances}
                  filteredDances={filteredDances}
                  index={index}
                  language={language}
                  t={tStr}
                  danceSearch={danceSearch}
                  setDanceSearch={setDanceSearch}
                  addDanceToSection={addDanceToSection}
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addSection}
            className="w-full bg-transparent"
          >
            <Plus className="mr-2 h-4 w-4"/>
            {t("addSection")}
          </Button>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? t("saving") : (ballToEdit ? t("update") : t("create"))}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
