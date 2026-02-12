// File: 'components/create-ball-form.tsx'
"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Plus, Trash2, GripVertical, X, Save} from "lucide-react"
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

// dnd-kit imports
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

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

// Ensure each entry has a stable unique id for DnD and React keys
type SectionEntry =
    | {
  kind: "dance"
  id: string
  danceId: string
  musicId?: string | null
  musicTracks?: MusicTrack[] // optional cache of tracks for this dance
}
    | {
  kind: "text"
  id: string
  content_ru: string
  content_de: string
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
  triggerClassName?: string
}

export function CreateBallForm({ dances, ballToEdit, triggerClassName }: CreateBallFormProps) {
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
                  id: sd.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
                  danceId: sd.dances?.id || sd.dance_id,
                  musicId: sd.music_id || null,
                  order_index: sd.order_index ?? 0,
                  musicTracks: dances.find(dance => dance.id === sd.dance_id)?.musicTracks ?? [],
                }))
            const textEntries = (section.section_texts || [])
                .sort((a: any, b: any) => a.order_index - b.order_index)
                .map((st: any) => ({
                  kind: "text" as const,
                  id: st.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
                  content_ru: st.content_ru || "",
                  content_de: st.content_de || "",
                  isEditing: false,
                  order_index: st.order_index ?? 0,
                }))
            const combined = [...danceEntries, ...textEntries]
                .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                .map(({ kind, id, ...rest }) => {
                  if (kind === "dance") {
                    const { danceId, musicId, musicTracks } = rest as any
                    return { kind, id, danceId, musicId, musicTracks } as SectionEntry
                  }
                  const { content_ru, content_de, isEditing } = rest as any
                  return { kind, id, content_ru, content_de, isEditing } as SectionEntry
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
  const [panelOpen, setPanelOpen] = useState<Record<number, 'text' | 'dance' | null>>({})
  const [pendingText, setPendingText] = useState<Record<number, { ru: string; de: string } | null>>({})
  const [editOrder, setEditOrder] = useState(false)

  // Remove early return; ensure hooks order is consistent across renders
  // if (!isAdmin) return null

  const filteredDances = dances.filter((dance) => {
    const displayName = language === "ru" ? (dance.name_ru || dance.name) : (dance.name_de || dance.name)
    return displayName.toLowerCase().includes(danceSearch.toLowerCase())
  })

  const tStr: (key: string) => string = (key: string) => t(key as any)

  const addSection = () => {
    setSections([...sections, { id: undefined, name: "", name_de: "", name_ru: "", dances: [] }])
    setActiveSection(sections.length)
    setPanelOpen(prev => ({ ...prev, [sections.length]: null }))
    setPendingText(prev => ({ ...prev, [sections.length]: null }))
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
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
    updateSection(sectionIndex, "dances", [...current, { kind: "dance", id, danceId, musicId }])
  }

  // When selecting a dance from the selector, add it and close the panel
  const addDanceToSectionAndClose = (sectionIndex: number, danceId: string) => {
    addDanceToSection(sectionIndex, danceId)
    setPanelOpen(prev => ({ ...prev, [sectionIndex]: null }))
    setDanceSearch("")
  }

  // Accept partial updates for localized text fields
  const updateTextEntry = (
    sectionIndex: number,
    danceIndex: number,
    patch: { content_ru?: string; content_de?: string }
  ) => {
    const current = [...sections[sectionIndex].dances]
    const entry = current[danceIndex]
    if (entry?.kind !== "text") return
    current[danceIndex] = { ...entry, ...patch }
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

  // dnd-kit drag over handler: optimistically reorder across sections for smooth placeholder animation
  const onDragOver = (event: any) => {
    const { active, over } = event
    if (!over) return

    const fromSection = active.data?.current?.sectionIndex as number | undefined
    const fromIndex = active.data?.current?.danceIndex as number | undefined
    const toSection = over.data?.current?.sectionIndex as number | undefined
    const toIndex = over.data?.current?.danceIndex as number | undefined

    if (
      fromSection === undefined ||
      fromIndex === undefined ||
      toSection === undefined ||
      toIndex === undefined
    ) {
      return
    }

    // If hovering over a different position, reflect it immediately
    setSections(prev => {
      const next = prev.map(s => ({ ...s, dances: [...s.dances] }))
      // Guard: if source equals target, skip
      if (fromSection === toSection && fromIndex === toIndex) return prev

      const [moved] = next[fromSection].dances.splice(fromIndex, 1)
      next[toSection].dances.splice(toIndex, 0, moved)

      // Update the indices in active/over data so subsequent events use fresh indices
      if (active.data?.current) {
        active.data.current.sectionIndex = toSection
        active.data.current.danceIndex = toIndex
      }

      return next
    })
  }

  // Track active item for DragOverlay rendering
  const [setActiveDrag] = useState<{ sectionIndex: number; danceIndex: number } | null>(null)

  // dnd-kit drag end handler: supports intra-section and cross-section reordering
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDrag(null)
    if (!over) return

    const fromSection = active.data?.current?.sectionIndex as number | undefined
    const fromIndex = active.data?.current?.danceIndex as number | undefined
    const toSection = over.data?.current?.sectionIndex as number | undefined
    const toIndex = over.data?.current?.danceIndex as number | undefined

    if (
      fromSection === undefined ||
      fromIndex === undefined ||
      toSection === undefined ||
      toIndex === undefined
    ) {
      return
    }

    setSections(prev => {
      const next = prev.map(s => ({ ...s, dances: [...s.dances] }))
      const [moved] = next[fromSection].dances.splice(fromIndex, 1)
      next[toSection].dances.splice(toIndex, 0, moved)
      return next
    })
  }

  // Sortable item component for entries using render-prop to avoid leaking props
  const SortableEntry: React.FC<{ sectionIndex: number; danceIndex: number; children: (args: { attributes: any; listeners: any; setNodeRef: (node: HTMLElement | null) => void; style: React.CSSProperties }) => React.ReactNode }> = ({ sectionIndex, danceIndex, children }) => {
    const entry = sections[sectionIndex]?.dances[danceIndex]
    const sortableId = entry?.id ?? `section-${sectionIndex}-entry-${danceIndex}`
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
      id: sortableId,
      data: { sectionIndex, danceIndex },
    })

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
    }

    return (
      <>{children({ attributes, listeners, setNodeRef, style })}</>
    )
  }

  const resetForm = () => {
    setNameDE(ballToEdit?.name_de || "")
    setNameRU(ballToEdit?.name_ru || "")
    setDate(ballToEdit?.date || "")
    setSelectedCityDE(ballToEdit?.place_de || "")
    setSelectedCityRU(ballToEdit?.place_ru || "")
    setSections(initialSections)
    setDanceSearch("")
    setActiveSection(0)
    setPanelOpen({})
    setPendingText({})
    setEditOrder(false)
  }

  // Bottom-panel handlers
  const openTextPanel = (index: number) => {
    setPanelOpen(prev => ({ ...prev, [index]: prev[index] === 'text' ? null : 'text' }))
    setPendingText(prev => ({ ...prev, [index]: prev[index] ?? { ru: "", de: "" } }))
  }

  const openDancePanel = (index: number) => {
    setPanelOpen(prev => {
      const isOpen = prev[index] === 'dance'
      if (isOpen) {
        // closing: also clear search to avoid keeping stale filters
        setDanceSearch("")
      }
      return { ...prev, [index]: isOpen ? null : 'dance' }
    })
  }

  const closePanel = (index: number) => {
    setPanelOpen(prev => ({ ...prev, [index]: null }))
  }

  const savePendingText = (index: number) => {
    const buf = pendingText[index]
    if (!buf || (!buf.ru.trim() && !buf.de.trim())) {
      closePanel(index)
      return
    }
    const current = sections[index].dances
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
    updateSection(index, "dances", [...current, { kind: "text", id, content_ru: buf.ru.trim(), content_de: buf.de.trim() }])
    setPendingText(prev => ({ ...prev, [index]: { ru: "", de: "" } }))
    closePanel(index)
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
          const contentRu = (e as any).content_ru?.trim() ?? ""
          const contentDe = (e as any).content_de?.trim() ?? ""
          if (contentRu.length > 0 || contentDe.length > 0) {
            combinedEntries.push({ kind: "text", content_ru: contentRu, content_de: contentDe, order_index: orderCounter })
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

  // Configure sensors: PointerSensor with activation constraint improves mobile DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // require slight movement to start drag to avoid accidental scroll/tap
      },
    })
  )

  // Guard rendering after hooks are defined to keep hooks order stable
  if (!isAdmin) {
    return null
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
          <Button className={triggerClassName}>
            <Edit className="mr-2 h-4 w-4" />
            {ballToEdit ? t("editBall") : (<><Plus className="mr-2 h-4 w-4" />{t("createBall")}</>)}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:max-w-2xl px-3 sm:px-6 pb-24 sm:pb-6">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="city-ru">{language === "ru" ? "Город" : "Stadt"} \(Русский\)</Label>
              <Input id="city-ru" value={selectedCityRU} onChange={(e) => setSelectedCityRU(e.target.value)} placeholder="напр. Москва" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city-de">{language === "ru" ? "Город" : "Stadt"} \(Deutsch\)</Label>
              <Input id="city-de" value={selectedCityDE} onChange={(e) => setSelectedCityDE(e.target.value)} placeholder="z.B. Berlin" />
            </div>
          </div>

          {/* Sections header with Edit Order toggle */}
          <div className="flex items-center justify-between mt-4 mb-2">
            <Label>{t("sections")}</Label>
            <Button
              type="button"
              variant={editOrder ? "default" : "outline"}
              onClick={() => {
                setEditOrder(prev => !prev)
                setPanelOpen({})
              }}
            >
              <GripVertical className="mr-2 h-4 w-4" />
              {language === "ru" ? (editOrder ? "Готово" : "Редактировать порядок") : (editOrder ? "Done" : "Edit order")}
            </Button>
          </div>

          {editOrder ? (
            // Edit mode: DnD enabled, handles visible, editing controls hidden
            <DndContext onDragOver={onDragOver} onDragStart={(event) => {
              const fromSection = event.active.data?.current?.sectionIndex as number | undefined
              const fromIndex = event.active.data?.current?.danceIndex as number | undefined
              if (fromSection !== undefined && fromIndex !== undefined) {
                setActiveDrag({ sectionIndex: fromSection, danceIndex: fromIndex })
              }
            }} onDragEnd={onDragEnd} sensors={sensors}>
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{t("section")} {index + 1}</h3>
                      {sections.length > 1 && (
                        <button onClick={() => removeSection(index)} className="text-destructive hover:text-destructive/80" aria-label="Remove section" title="Remove section">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <SortableContext items={section.dances.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                      {section.dances.map((entry, danceIndex) => (
                        <SortableEntry key={entry.id} sectionIndex={index} danceIndex={danceIndex}>
                          {({ attributes, listeners, setNodeRef, style }) => (
                            <div ref={setNodeRef} style={style} {...attributes} className="border rounded-md p-2 sm:p-3 bg-muted/30">
                              <div className="flex items-center gap-2">
                                {/* Drag handle */}
                                <span className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground" role="button" aria-label="Drag entry" {...listeners} title="Drag" style={{ touchAction: 'none' }}>
                                  <GripVertical className="h-4 w-4" />
                                </span>

                                {entry.kind === "dance" && (
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                                    {section.dances.slice(0, danceIndex).filter(d => d.kind === "dance").length + 1}
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  {entry.kind === "dance" ? (
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1">
                                        <div className="text-sm font-semibold text-[#6b3e26]">
                                          {language === "ru" ? (dances.find(d => d.id === entry.danceId)?.name_ru || dances.find(d => d.id === entry.danceId)?.name) : (dances.find(d => d.id === entry.danceId)?.name_de || dances.find(d => d.id === entry.danceId)?.name)}
                                        </div>
                                        {/* music select hidden in edit mode */}
                                      </div>
                                      {/* Remove button hidden in edit mode */}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {(entry as any).isEditing ? (
                                        // editing UI omitted in edit mode
                                        <></>
                                      ) : (
                                        <div className="pl-10">
                                          <div className="flex items-center gap-2">
                                            <div className="flex-1">
                                              <div className="text-sm whitespace-pre-wrap font-semibold text-[#6b3e26]">
                                                {language === "ru" ? ((entry as any).content_ru || "") : ((entry as any).content_de || "")}
                                              </div>
                                              {/* edit text button hidden in edit mode */}
                                            </div>
                                            {/* remove text hidden in edit mode */}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </SortableEntry>
                      ))}
                    </SortableContext>

                    {/* Bottom controls hidden in edit mode */}
                  </div>
                ))}
              </div>

              {/* Drag overlay for smoother cross-section animation */}
              {/* Rendering minimal overlay to match entry shape */}
              {/* Optional: customize dropAnimation if needed */}
            </DndContext>
          ) : (
            // View mode: DnD disabled, handles hidden, editing controls visible
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{t("section")} {index + 1}</h3>
                    {sections.length > 1 && (
                      <button onClick={() => removeSection(index)} className="text-destructive hover:text-destructive/80" aria-label="Remove section" title="Remove section">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {section.dances.map((entry, danceIndex) => (
                    <div key={entry.id} className="border rounded-md p-2 sm:p-3 bg-muted/30">
                      <div className="flex items-center gap-2">
                        {/* No drag handle in view mode */}
                        {entry.kind === "dance" && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                            {section.dances.slice(0, danceIndex).filter(d => d.kind === "dance").length + 1}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {entry.kind === "dance" ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-[#6b3e26]">
                                  {language === "ru" ? (dances.find(d => d.id === entry.danceId)?.name_ru || dances.find(d => d.id === entry.danceId)?.name) : (dances.find(d => d.id === entry.danceId)?.name_de || dances.find(d => d.id === entry.danceId)?.name)}
                                </div>
                                {/* Music select visible in view mode */}
                                <div className="mt-4">
                                  <select
                                    value={(entry as any).musicId || ""}
                                    onChange={(e) => updateDanceMusicInSection(index, danceIndex, e.target.value || null)}
                                    className="text-xs border rounded px-2 py-1 bg-background"
                                  >
                                    <option value="">{t("chooseLater")}</option>
                                    {(entry.musicTracks || []).map((track) => (
                                      <option key={track.id} value={track.id}>
                                        {track.title}{track.artist ? ` - ${track.artist}` : ""}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              {/* Remove button visible in view mode */}
                              <button onClick={() => removeEntryFromSection(index, danceIndex)} className="text-destructive hover:text-destructive/80" aria-label="Remove dance" title="Remove">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(entry as any).isEditing ? (
                                  <>
                                    <div className="space-y-2 pl-10">
                                      <Label htmlFor="section-text-ru">Русский</Label>
                                      <Input
                                          id="section-text-ru"
                                          value={(entry as any).content_ru || ""}
                                          onChange={(e) => updateTextEntry(index, danceIndex, {content_ru: e.target.value})}
                                          placeholder={"Напр. 'Подарочный танец от Берлина'"}
                                      />
                                    </div>
                                    <div className="space-y-2 pl-10">
                                      <Label htmlFor="section-text-de">Deutsch</Label>
                                      <Input
                                          id="section-text-de"
                                          value={(entry as any).content_de || ""}
                                          onChange={(e) => updateTextEntry(index, danceIndex, {content_de: e.target.value})}
                                          placeholder={"Z.b. 'Ein Geschenktanz aus Berlin'"}
                                      />
                                    </div>
                                    <div className="pl-10">
                                      <button
                                          type="button"
                                          onClick={() => saveTextEntry(index, danceIndex)}
                                          className="text-xs px-2 py-1 rounded border hover:bg-accent/20"
                                      >
                                        <Save className="inline-block mr-1 h-3 w-3"/>
                                        {tStr("save") || "Save"}
                                      </button>
                                    </div>
                                  </>
                              ) : (
                                  <div className="pl-10">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1">
                                        <div className="text-sm whitespace-pre-wrap font-semibold text-[#6b3e26]">
                                          {language === "ru" ? ((entry as any).content_ru || "") : ((entry as any).content_de || "")}
                                        </div>
                                        {/* Edit text visible in view mode */}
                                        <div className="mt-4">
                                          <button type="button" onClick={() => {
                                            const current = [...sections[index].dances]
                                            const e = current[danceIndex]
                                            if (e?.kind === "text") {
                                              current[danceIndex] = {...(e as any), isEditing: true}
                                              updateSection(index, "dances", current)
                                            }
                                          }}
                                                  className="text-xs border rounded px-2 py-1 bg-background hover:bg-accent/20">
                                            {language === "ru" ? "Редактировать" : "Bearbeiten"}
                                          </button>
                                        </div>
                                      </div>
                                      {/* Remove text visible in view mode */}
                                      <button onClick={() => removeEntryFromSection(index, danceIndex)}
                                              className="text-destructive hover:text-destructive/80"
                                              aria-label="Remove text" title="Remove">
                                        <Trash2 className="h-4 w-4"/>
                                      </button>
                                    </div>
                                  </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Bottom controls visible in view mode */}
                  <div className="w-full">
                    <div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Button type="button" variant="outline" onClick={() => { openTextPanel(index); }} className="bg-transparent w-full sm:flex-1">
                        <Plus className="mr-2 h-4 w-4" />{tStr("addText") || "Add text"}
                      </Button>
                      <span className="hidden sm:inline text-sm text-muted-foreground mx-2">{tStr("or") || "or"}</span>
                      <Button type="button" variant="outline" onClick={() => { openDancePanel(index); }} className="bg-transparent w-full sm:flex-1">
                        <Plus className="mr-2 h-4 w-4" />{tStr("addAnotherDance")}
                      </Button>
                    </div>

                    {panelOpen[index] === 'text' && (
                        <div className="mt-3 border rounded-md p-2 sm:p-3 bg-muted/30">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor={`pending-text-ru-${index}`}>Русский</Label>
                              <Input
                                  id={`pending-text-ru-${index}`}
                                  value={pendingText[index]?.ru ?? ""}
                                  onChange={(e) => setPendingText(prev => ({
                                    ...prev,
                                    [index]: {ru: e.target.value, de: prev[index]?.de ?? ""}
                                  }))}
                                  placeholder={"Напр. 'Подарочный танец от Берлина'"}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`pending-text-de-${index}`}>Deutsch</Label>
                              <Input
                                  id={`pending-text-de-${index}`}
                                  value={pendingText[index]?.de ?? ""}
                                  onChange={(e) => setPendingText(prev => ({
                                    ...prev,
                                    [index]: {ru: prev[index]?.ru ?? "", de: e.target.value}
                                  }))}
                                  placeholder={"Z.b. 'Ein Geschenktanz aus Berlin'"}
                              />
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Button type="button" variant="outline" onClick={() => savePendingText(index)}
                                    className="bg-transparent">
                              <Save className="mr-2 h-4 w-4"/>{tStr("save") || "Save"}
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => closePanel(index)}>
                              <X className="mr-2 h-4 w-4"/>{tStr("cancel") || "Cancel"}
                            </Button>
                          </div>
                        </div>
                    )}

                    <div className="mt-2">
                      <DanceSelector
                          sectionDances={section.dances as any}
                          filteredDances={filteredDances}
                          index={index}
                          language={language}
                          t={tStr}
                          danceSearch={danceSearch}
                          setDanceSearch={setDanceSearch}
                          addDanceToSection={addDanceToSectionAndClose}
                          open={panelOpen[index] === 'dance'}
                          onOpenChange={(open) => setPanelOpen(prev => ({...prev, [index]: open ? 'dance' : null}))}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addSection} className="w-full bg-transparent">
                <Plus className="mr-2 h-4 w-4"/>
                {t("addSection")}
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-end">
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
