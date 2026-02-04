"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Edit, Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { createBall, updateBall } from "@/app/actions/ball"
import { useLanguage } from "@/hooks/use-language" // Declare the useLanguage variable

interface Dance {
  id: string
  name: string
  name_de: string | null
  name_ru: string | null
  difficulty: string | null
}

interface Section {
  id?: string
  name: string
  name_de: string
  name_ru: string
  dances: string[]
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

  const [nameDE, setNameDE] = useState(ballToEdit?.name_de || "")
  const [nameRU, setNameRU] = useState(ballToEdit?.name_ru || "")
  const [date, setDate] = useState(ballToEdit?.date || "")
  const [selectedCityDE, setSelectedCityDE] = useState(ballToEdit?.place_de || "")
  const [selectedCityRU, setSelectedCityRU] = useState(ballToEdit?.place_ru || "")
  const [sections, setSections] = useState<Section[]>(
    ballToEdit?.sections || [{ id: undefined, name: "", name_de: "", name_ru: "", dances: [] }]
  )
  const [danceSearch, setDanceSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState(0)

  if (!isAdmin) {
    return null
  }

  const filteredDances = dances.filter((dance) => {
    const displayName = language === "ru"
      ? (dance.name_ru || dance.name)
      : (dance.name_de || dance.name)
    return displayName.toLowerCase().includes(danceSearch.toLowerCase())
  })

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

  const toggleDanceInSection = (danceId: string) => {
    const currentDances = sections[activeSection].dances
    if (currentDances.includes(danceId)) {
      updateSection(activeSection, "dances", currentDances.filter(id => id !== danceId))
    } else {
      // Add dance in order
      updateSection(activeSection, "dances", [...currentDances, danceId])
    }
  }

  const removeDanceFromSection = (index: number) => {
    const currentDances = sections[activeSection].dances
    updateSection(activeSection, "dances", currentDances.filter((_, i) => i !== index))
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
    <Dialog open={open} onOpenChange={setOpen}>
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
      <DialogContent className="max-h-screen overflow-y-auto max-w-2xl">
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
                {section.dances.map((danceId, danceIndex) => {
                  const dance = dances.find(d => d.id === danceId)
                  return (
                    <div key={danceIndex} className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                        {danceIndex + 1}
                      </div>
                      <div className="flex-1 text-sm">
                        {language === "ru"
                          ? (dance?.name_ru || dance?.name)
                          : (dance?.name_de || dance?.name)}
                      </div>
                      <button
                        onClick={() => removeDanceFromSection(danceIndex)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}

                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor={`dance-select-${index}`}>
                    {section.dances.length > 0 ? t("addAnotherDance") : t("selectDancesForBall")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={`dance-search-${index}`}
                      placeholder={t("search")}
                      value={danceSearch}
                      onChange={(e) => setDanceSearch(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="border rounded max-h-60 overflow-auto">
                    <div className="space-y-1">
                      {filteredDances.map((dance) => (
                        <div
                          key={dance.id}
                          onClick={() => {
                            toggleDanceInSection(dance.id)
                            setDanceSearch("")
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-accent flex items-center justify-between"
                        >
                          <span className="text-sm">
                            {language === "ru"
                              ? (dance.name_ru || dance.name)
                              : (dance.name_de || dance.name)}
                          </span>
                          {section.dances.includes(dance.id) && (
                            <span className="text-primary text-sm font-medium">✓</span>
                          )}
                        </div>
                      ))}
                      {filteredDances.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {t("noDancesFound")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addSection}
            className="w-full bg-transparent"
          >
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
