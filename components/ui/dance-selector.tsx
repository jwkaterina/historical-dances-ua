import { Input } from "@/components/ui/input"
import { useEffect } from "react"

function DanceSelector({
                           sectionDances,
                           filteredDances,
                           index,
                           language,
                           t,
                           danceSearch,
                           setDanceSearch,
                           addDanceToSection,
                           open,
                           onOpenChange,
                       }: {
    sectionDances: any[]
    filteredDances: any[]
    index: number
    language: string
    t: (key: string) => string
    danceSearch: string
    setDanceSearch: (v: string) => void
    addDanceToSection: (sectionIndex: number, danceId: string) => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
}) {
    useEffect(() => {
        if (open) {
            // Autofocus the search input when panel opens
            setTimeout(() => {
                const el = document.getElementById(`dance-search-${index}`) as HTMLInputElement | null
                el?.focus()
            }, 0)
        }
    }, [open, index])

    const handleAddDance = (danceId: string) => {
        addDanceToSection(index, danceId)
        setDanceSearch("")
        onOpenChange?.(false)
    }

    return (
        <div className={`space-y-2 pt-2 border-t transition-[max-height,opacity,padding] duration-200 ease-in-out ${open ? 'opacity-100 max-h-[400px] py-2' : 'opacity-0 max-h-0 py-0 overflow-hidden'}`}>
            <div className="flex gap-2">
                <Input
                    id={`dance-search-${index}`}
                    placeholder={t("searchDances")}
                    value={danceSearch}
                    onChange={(e) => setDanceSearch(e.target.value)}
                    className="flex-1"
                />
            </div>
            <div className="border rounded max-h-60 overflow-auto">
                <div className="space-y-1">
                    {filteredDances.map((dance) => {
                        const isSelected = sectionDances.some((d: any) => d.danceId === dance.id)
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
