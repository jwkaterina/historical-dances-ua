"use client"

import { BookOpen, Check, GraduationCap, BookMarked, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUserDanceStatus } from "@/components/user-dance-status-provider"
import { useLanguage } from "@/components/language-provider"
import { useToast } from "@/hooks/use-toast"
import type { ListType } from "@/app/actions/user-dance-status"

interface DanceListSelectorProps {
  danceId: string
  size?: "sm" | "default"
}

const LIST_OPTIONS: { value: ListType; translationKey: string; icon: typeof BookOpen }[] = [
  { value: "already_learned", translationKey: "alreadyLearned", icon: GraduationCap },
  { value: "learning", translationKey: "learning", icon: BookMarked },
  { value: "plan_to_learn", translationKey: "planToLearn", icon: Lightbulb },
]

export function DanceListSelector({ danceId, size = "sm" }: DanceListSelectorProps) {
  const { statuses, isAuthenticated, setListType } = useUserDanceStatus()
  const { t } = useLanguage()
  const { toast } = useToast()

  const status = statuses.get(danceId)
  const currentList = status?.list_type ?? null
  const activeOption = LIST_OPTIONS.find(o => o.value === currentList)
  const IconComponent = activeOption?.icon ?? BookOpen

  const handleSelect = async (e: Event, listType: ListType) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: t("toastError"),
        description: t("loginToUseLists"),
        variant: "destructive",
      })
      return
    }

    try {
      await setListType(danceId, listType)
    } catch (error) {
      toast({
        title: t("toastError"),
        description: t("toastFailedUpdateStatus"),
        variant: "destructive",
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
        <Button
          variant="ghost"
          size={size === "sm" ? "icon" : "default"}
          className={size === "sm" ? "h-8 w-8 shrink-0" : ""}
          title={t("addToList")}
        >
          <IconComponent className={`h-4 w-4 ${currentList ? "text-primary" : ""}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {LIST_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={(e) => handleSelect(e, currentList === option.value ? null : option.value)}
          >
            <span className="flex items-center gap-2">
              {currentList === option.value ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <option.icon className="h-4 w-4 text-muted-foreground" />
              )}
              <span>{t(option.translationKey as any)}</span>
            </span>
          </DropdownMenuItem>
        ))}
        {currentList && (
          <DropdownMenuItem onSelect={(e) => handleSelect(e, null)}>
            <span className="ml-6 text-muted-foreground">{t("removeFromList")}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
