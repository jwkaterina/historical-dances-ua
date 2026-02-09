// File: 'components/create-ball-form.tsx'
"use client"

import React, { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Plus, Trash2, GripVertical, Save } from "lucide-react"
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
import { useLanguage } from "@/hooks/use-language"

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

type SectionEntry =
    | {
  kind: "dance"
  danceId: string
  musicId?: string | null
}
    | {
  kind: "text"
  content: string
  isEditing?: boolean
}

interface Section {
  id?: string
  name: string
  name_de: string
  name_ru: string
  dances: SectionEntry[]
}

interface CreateBallFormProps {
  dances: Dance[]
  ballToEdit?: any
}

export function CreateBallForm({ dances, ballToEdit }: CreateBallFormProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { isAdmin } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)

  const initialSections = useMemo(() => {
    if (ballToEdit?.ball_sections && ballToEdit.ball_sections.length > 0) {
      return ballToEdit.ball_sections
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((section: any) => {
            const danceEntries = (section.section_dances || [])
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((sd: any) => ({
                  kind: "dance" as const,
                  danceId: sd.dances?.id || sd.dance_id,
                  musicId: sd.music_id || null,
                  order_index: sd.order_index ?? 0,
                }))
            const textEntries = (section.section_texts || [])
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((st: any) => ({
                  kind: "text" as const,
                  content: st.content || "",
                  isEditing: false,
                  order_index: st.order_index ?? 0,
                }))
            const combined = [...danceEntries, ...textEntries]
                .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                .map(({ kind, ...rest }) => {
                  if (kind === "dance") {
                    const { danceId, musicId } = rest as any
                    return { kind, danceId, musicId } as SectionEntry
                  }
                  const { content, isEditing } = rest as any
                  return { kind, content, isEditing } as SectionEntry
                })
            return {
              id: section.id,
              name: section.name || "",
              name_de: section.name_de || "",
              name_ru: section.name_ru || "",
              dances: combined,
            }
          })
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
  const pickerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [pickerHeights, setPickerHeights] = useState<Record<string, number>>({})
  const [danceSelectorOpen, setDanceSelectorOpen] = useState<Record<number, boolean>>({})

  if (!isAdmin) return null

  const filteredDances = dances.filter((dance) => {
    const displayName = language === "ru" ? (dance.name_ru || dance.name) : (dance.name_de || dance.name)
    return displayName.toLowerCase().includes(danceSearch.toLowerCase())
  })

  const tStr: (key: string) => string = (key: string) => t(key as any)

  function closeAllTrackPickers() {
    setTrackPickerOpen({})
  }

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

  async function toggleTrackPicker(sectionIndex: number, danceIndex: number, danceId?: string) {
    if (!danceId) {
      toast({ title: t("error"), description: t("noTracksAvailable") })
      return
    }
    const key = `${sectionIndex}:${danceIndex}`
    setTrackPickerOpen(prev => ({ ...prev, [key]: !prev[key] }))
    await ensureTracksLoaded(danceId)
    requestAnimationFrame(() => {
      const el = pickerRefs.current[key]
      if (!el) return
      const prevMax = el.style.maxHeight
      el.style.maxHeight = "none"
      const measured = el.scrollHeight
      el.style.maxHeight = prevMax
      setPickerHeights(prev => ({ ...prev, [key]: measured }))
    })
  }

  const addSection = () => {
    setSections([...sections, { id: undefined, name: "", name_de: "", name_ru: "", dances: [] }])
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
    const current = sections[sectionIndex].dances
    if (current.some(e => e.kind === "dance" && e.danceId === danceId)) return
    const musicId = dance?.musicTracks?.length === 1 ? dance.musicTracks[0].id : null
    updateSection(sectionIndex, "dances", [...current, { kind: "dance", danceId, musicId }])
  }

  const addTextToSection = (sectionIndex: number) => {
    const current = sections[sectionIndex].dances
    updateSection(sectionIndex, "dances", [...current, { kind: "text", content: "", isEditing: true }])
  }

  const updateTextEntry = (sectionIndex: number, danceIndex: number, content: string) => {
    const current = [...sections[sectionIndex].dances]
    const entry = current[danceIndex]
    if (entry?.kind !== "text") return
    current[danceIndex] = { ...entry, content }
    updateSection(sectionIndex, "dances", current)
  }

  const saveTextEntry = (sectionIndex: number, danceIndex: number) => {
    const current = [...sections[sectionIndex].dances]
    const entry = current[danceIndex]
    if (entry?.kind !== "text") return
    current[danceIndex] = { ...entry, isEditing: false }
    updateSection(sectionIndex, "dances", current)
  }

  const updateDanceMusicInSection = (sectionIndex: number, danceIndex: number, musicId: string | null) => {
    const current = [...sections[sectionIndex].dances]
    const entry = current[danceIndex]
    if (entry?.kind !== "dance") return
    current[danceIndex] = { ...entry, musicId }
    updateSection(sectionIndex, "dances", current)
  }

  const removeEntryFromSection = (sectionIndex: number, danceIndex: number) => {
    const current = sections[sectionIndex].dances
    updateSection(sectionIndex, "dances", current.filter((_, i) => i !== danceIndex))
  }

  const handleDragStart = (sectionIndex: number, danceIndex: number) => (e: React.DragEvent) => {
    closeAllTrackPickers()
    e.dataTransfer.setData("application/json", JSON.stringify({ fromSection: sectionIndex, fromIndex: danceIndex }))
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (sectionIndex: number, danceIndex: number) => (e: React.DragEvent) => {
    e.preventDefault()
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
      next[sectionIndex].dances.splice(danceIndex, 0, moved)
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
    // close any open dance selector panels so they are not visible next time the dialog opens
    setDanceSelectorOpen({})
    closeAllTrackPickers()
  }

  const handleSubmit = async () => {
    if (!nameDE || !nameRU || !date || !selectedCityDE || !selectedCityRU) {
      toast({ title: t("error"), description: t("fillAllFields"), variant: "destructive" })
      return
    }

    const filledSections = sections.filter(s => s.dances.length > 0)

    // Serialize: produce a single ordered entries array per section where each entry has an order_index
    const serializedSections = filledSections.map((s, idx) => {
      // Build combined entries and assign sequential order_index only to kept entries
      const combinedEntries: any[] = []
      let orderCounter = 0
      for (const e of s.dances) {
        if (e.kind === "dance") {
          combinedEntries.push({ kind: "dance", danceId: e.danceId, musicId: e.musicId ?? null, order_index: orderCounter })
          orderCounter++
        } else {
          const content = (e as any).content?.trim() ?? ""
          if (content.length > 0) {
            combinedEntries.push({ kind: "text", content, order_index: orderCounter })
            orderCounter++
          }
        }
      }

      // legacy dances array (only dances in order of appearance)
      const danceEntries = s.dances
        .map(e => e.kind === "dance" ? { danceId: e.danceId, musicId: (e as any).musicId ?? null } : null)
        .filter(Boolean) as { danceId: string; musicId?: string | null }[]

      return {
        id: s.id,
        name: `Section ${idx + 1}`,
        name_de: `Abteilung ${idx + 1}`,
        name_ru: `Отделение ${idx + 1}`,
        entries: combinedEntries,
        dances: danceEntries,
      }
    })

    setLoading(true)
    try {
      const ballData = {
        name: nameDE,
        name_de: nameDE,
        name_ru: nameRU,
        date,
        place_de: selectedCityDE,
        place_ru: selectedCityRU,
        sections: serializedSections,
      }

      if (ballToEdit?.id) {
        await updateBall(ballToEdit.id, ballData as any)
        toast({ title: t("success"), description: t("ballUpdated") })
      } else {
        await createBall(ballData as any)
        toast({ title: t("success"), description: t("ballCreated") })
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      toast({ title: t("error"), description: (error as Error).message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
      <Dialog
          open={open}
          onOpenChange={(newOpen) => {
            if (newOpen) resetForm()
            setOpen(newOpen)
          }}
      >
        <DialogTrigger asChild>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            {ballToEdit ? t("editBall") : (<><Plus className="mr-2 h-4 w-4" />{t("createBall")}</>)}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl pb-20 sm:pb-6">
          <DialogHeader>
            <DialogTitle>{ballToEdit ? t("editBall") : t("createBall")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name-ru">{language === "ru" ? "Название бала" : t("ballName")} \(Русский\)</Label>
              <Input id="name-ru" value={nameRU} onChange={(e) => setNameRU(e.target.value)} placeholder="напр. Новогодний бал" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name-de">{language === "ru" ? t("ballName") : "Ballname"} \(Deutsch\)</Label>
              <Input id="name-de" value={nameDE} onChange={(e) => setNameDE(e.target.value)} placeholder="z.B. Silvesterball" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">{t("ballDate")}</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city-ru">{language === "ru" ? "Город" : "Stadt"} \(Русский\)</Label>
              <Input id="city-ru" value={selectedCityRU} onChange={(e) => setSelectedCityRU(e.target.value)} placeholder="напр. Москва" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city-de">{language === "ru" ? "Город" : "Stadt"} \(Deutsch\)</Label>
              <Input id="city-de" value={selectedCityDE} onChange={(e) => setSelectedCityDE(e.target.value)} placeholder="z.B. Berlin" />
            </div>
          </div>

          <div className="space-y-4">
            <Label>{t("sections")}</Label>
            {sections.map((section, index) => {
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{t("section")} {index + 1}</h3>
                    {sections.length > 1 && (
                      <button onClick={() => removeSection(index)} className="text-destructive hover:text-destructive/80" aria-label="Remove section" title="Remove section">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {section.dances.map((entry, danceIndex) => {
                      const pickerKey = `${index}:${danceIndex}`
                      const isPickerOpen = !!trackPickerOpen[pickerKey]
                      const dance = entry.kind === "dance" ? dances.find(d => d.id === entry.danceId) : null
                      const tracks = entry.kind === "dance" ? (tracksByDance[(entry as any).danceId] || []) : []
                      const isLoadingTracks = entry.kind === "dance" ? !!tracksLoading[(entry as any).danceId] : false
                      const loadError = entry.kind === "dance" ? tracksError[(entry as any).danceId] : null
                      const danceNumber = entry.kind === "dance" ? section.dances.slice(0, danceIndex).filter(d => d.kind === "dance").length + 1 : null

                      return (
                        <div
                          key={danceIndex}
                          className={`border rounded-md p-3 bg-muted/30 ${dragOverTarget && dragOverTarget.sectionIndex === index && dragOverTarget.danceIndex === danceIndex ? "ring-2 ring-primary/40" : ""}`}
                          onDragOver={handleDragOver(index, danceIndex)}
                          onDrop={handleDropOnDance(index, danceIndex)}
                          onDragLeave={handleDragLeave}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                              role="button"
                              aria-label="Drag entry"
                              draggable
                              onDragStart={handleDragStart(index, danceIndex)}
                              onDragEnd={handleDragLeave}
                              title="Drag"
                            >
                              <GripVertical className="h-4 w-4" />
                            </span>

                            {entry.kind === "dance" && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                                {danceNumber}
                              </div>
                            )}

                            <div className="flex-1">
                              {entry.kind === "dance" ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 text-sm font-medium">
                                    {language === "ru" ? (dance?.name_ru || dance?.name) : (dance?.name_de || dance?.name)}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleTrackPicker(index, danceIndex, (entry as any).danceId)}
                                    className="text-xs px-2 py-1 rounded border hover:bg-accent/20 disabled:opacity-50 min-w-[6.5rem]"
                                    aria-expanded={isPickerOpen}
                                    aria-controls={`track-picker-${index}-${danceIndex}`}
                                    aria-busy={isLoadingTracks}
                                    disabled={isLoadingTracks}
                                  >
                                    {isLoadingTracks ? (tStr("loading") || "Loading…") : t("selectTrack")}
                                  </button>
                                  <button
                                    onClick={() => removeEntryFromSection(index, danceIndex)}
                                    className="text-destructive hover:text-destructive/80"
                                    aria-label="Remove dance"
                                    title="Remove"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {(entry as any).isEditing ? (
                                    <>
                                      <textarea
                                        value={(entry as any).content || ""}
                                        onChange={(e) => updateTextEntry(index, danceIndex, e.target.value)}
                                        className="w-full min-h-[80px] text-sm border rounded px-2 py-1 bg-background"
                                        placeholder={tStr("sectionIntro") || "Text before dances..."}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => saveTextEntry(index, danceIndex)}
                                        className="text-xs px-2 py-1 rounded border hover:bg-accent/20"
                                      >
                                        <Save className="inline-block mr-1 h-3 w-3" />
                                        {tStr("save") || "Save"}
                                      </button>
                                    </>
                                  ) : (
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="text-sm whitespace-pre-wrap">{(entry as any).content}</div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const current = [...sections[index].dances]
                                            const e = current[danceIndex]
                                            if (e?.kind === "text") {
                                              current[danceIndex] = { ...(e as any), isEditing: true }
                                              updateSection(index, "dances", current)
                                            }
                                          }}
                                          className="text-xs px-2 py-1 rounded border hover:bg-accent/20"
                                        >
                                          {tStr("edit") || "Edit"}
                                        </button>
                                        <button
                                          onClick={() => removeEntryFromSection(index, danceIndex)}
                                          className="text-destructive hover:text-destructive/80"
                                          aria-label="Remove text"
                                          title="Remove"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {entry.kind === "dance" && (
                            <div
                              id={`track-picker-${index}-${danceIndex}`}
                              ref={(el) => { pickerRefs.current[pickerKey] = el }}
                              className={`mt-2 ml-10 overflow-hidden transition-[max-height,padding,opacity] duration-300 ease-in-out ${isPickerOpen ? "opacity-100 py-2" : "opacity-0 py-0"}`}
                              style={{ maxHeight: isPickerOpen ? (pickerHeights[pickerKey] || 0) : 0 }}
                            >
                              {!isLoadingTracks && loadError && (
                                <div className="text-xs text-destructive">{loadError}</div>
                              )}
                              {!isLoadingTracks && !loadError && (
                                <>
                                  {tracks.length === 0 ? (
                                    <div className="text-xs text-muted-foreground italic">{tStr("noTracksAvailable")}</div>
                                  ) : (
                                    <select
                                      value={(entry as any).musicId || ""}
                                      onChange={(e) => updateDanceMusicInSection(index, danceIndex, e.target.value || null)}
                                      className="w-full text-sm border rounded px-2 py-1 bg-background"
                                    >
                                      <option value="">{t("chooseLater")}</option>
                                      {tracks.map((track) => (
                                        <option key={track.id} value={track.id}>{track.title}{track.artist ? ` - ${track.artist}` : ""}</option>
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

                    <div className="w-full">
                      <div className="flex w-full items-center gap-2">
                        <Button type="button" variant="outline" onClick={() => addTextToSection(index)} className="bg-transparent flex-1">
                          <Plus className="mr-2 h-4 w-4" />{tStr("addText") || "Add text"}
                        </Button>
                        <span className="text-sm text-muted-foreground mx-2">{tStr("or") || "or"}</span>
                        <Button type="button" variant="outline" onClick={() => { setDanceSelectorOpen(prev => ({ ...prev, [index]: true })); setActiveSection(index) }} className="bg-transparent flex-1">
                          <Plus className="mr-2 h-4 w-4" />{tStr("addAnotherDance")}
                        </Button>
                      </div>
                    </div>

                    <DanceSelector
                      sectionDances={section.dances as any}
                      filteredDances={filteredDances}
                      index={index}
                      language={language}
                      t={tStr}
                      danceSearch={danceSearch}
                      setDanceSearch={setDanceSearch}
                      addDanceToSection={addDanceToSection}
                      open={!!danceSelectorOpen[index]}
                      onOpenChange={(open) => setDanceSelectorOpen(prev => ({ ...prev, [index]: open }))}
                    />
                  </div>
                </div>
              )
            })}

            <Button type="button" variant="outline" onClick={addSection} className="w-full bg-transparent">
              <Plus className="mr-2 h-4 w-4" />
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
