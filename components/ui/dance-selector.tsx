import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

function DanceSelector({
                           sectionDances,
                           filteredDances,
                           index,
                           language,
                           t,
                           danceSearch,
                           setDanceSearch,
                           addDanceToSection,
                       }: {
    sectionDances: any[]
    filteredDances: any[]
    index: number
    language: string
    t: (key: string) => string
    danceSearch: string
    setDanceSearch: (v: string) => void
    addDanceToSection: (sectionIndex: number, danceId: string) => void
}) {
    const [showInput, setShowInput] = useState(sectionDances.length === 0)

    const handleAddDance = (danceId: string) => {
        addDanceToSection(index, danceId)
        setDanceSearch("")
        setShowInput(false)
    }

    if (!showInput && sectionDances.length > 0) {
        return (
            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowInput(true)}
            >
                {t("addAnotherDance")}
            </Button>
        )
    }

    return (
        <div className="space-y-2 pt-2 border-t">
            <Label htmlFor={`dance-select-${index}`}>
                {sectionDances.length > 0 ? t("addAnotherDance") : t("selectDancesForBall")}
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
                    {filteredDances.map((dance) => {
                        const isSelected = sectionDances.some(d => d.danceId === dance.id)
                        return (
                            <div
                                key={dance.id}
                                onClick={() => {
                                    if (!isSelected) {
                                        handleAddDance(dance.id)
                                    }
                                }}
                                className={`px-3 py-2 cursor-pointer hover:bg-accent flex items-center justify-between ${isSelected ? 'opacity-50' : ''}`}
                            >
                <span className="text-sm">
                  {language === "ru"
                      ? (dance.name_ru || dance.name)
                      : (dance.name_de || dance.name)}
                </span>
                                {isSelected && (
                                    <span className="text-primary text-sm font-medium">✓</span>
                                )}
                            </div>
                        )
                    })}
                    {filteredDances.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                            {t("noDancesFound")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DanceSelector
