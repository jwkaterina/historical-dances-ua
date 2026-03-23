"use client"

import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useUserDanceStatus } from "@/components/user-dance-status-provider"
import { useLanguage } from "@/components/language-provider"
import { useToast } from "@/hooks/use-toast"

interface FavoriteButtonProps {
  danceId: string
  size?: "sm" | "default"
}

export function FavoriteButton({ danceId, size = "sm" }: FavoriteButtonProps) {
  const { statuses, isAuthenticated, toggleFavorite } = useUserDanceStatus()
  const { t } = useLanguage()
  const { toast } = useToast()

  const status = statuses.get(danceId)
  const isFavorite = status?.is_favorite ?? false

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: t("toastError"),
        description: t("loginToFavorite"),
        variant: "destructive",
      })
      return
    }

    try {
      await toggleFavorite(danceId)
    } catch (error) {
      toast({
        title: t("toastError"),
        description: t("toastFailedUpdateStatus"),
        variant: "destructive",
      })
    }
  }

  return (
    <Button
      variant="ghost"
      size={size === "sm" ? "icon" : "default"}
      className={size === "sm" ? "h-8 w-8 shrink-0" : ""}
      onClick={handleClick}
      title={isFavorite ? t("removeFromFavorites") : t("addToFavorites")}
    >
      <Heart
        className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`}
      />
    </Button>
  )
}
