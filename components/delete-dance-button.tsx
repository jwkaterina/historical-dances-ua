"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { deleteDance } from "@/app/actions/dance"
import { Trash2 } from "lucide-react"

interface DeleteDanceButtonProps {
  danceId: string
  danceName: string
  compact?: boolean
}

export function DeleteDanceButton({ danceId, danceName, compact }: DeleteDanceButtonProps) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const { isAdmin, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const result = await deleteDance(danceId) as any
      if (result && result.success === false && result.code === 'DANCE_IN_BALLS') {
        const ballNames = Array.isArray(result.balls)
          ? result.balls
              .map((b: any) => (language === 'ru' ? b.name_ru : (b.name_ua ?? b.name)) || b.name)
              .filter(Boolean)
          : []
        const isPlural = ballNames.length > 1
        const prefix = t(isPlural ? 'toastDanceUsedInBalls' : 'toastDanceUsedInBall')
        const suffix = t('toastRemoveFromBallsFirst')
        const description = `${prefix} ${ballNames.join(', ')}. ${suffix}`
        toast({
          title: t('toastError'),
          description,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: t('toastSuccess'),
        description: t('toastDanceDeleted'),
      })
      router.push('/')
    } catch (error) {
      console.error('[v0] Error deleting dance:', error)
      toast({
        title: t('toastError'),
        description: error instanceof Error ? error.message : t('toastFailedDeleteDance'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{t("deleteDance")}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteConfirmMessage")} {`"${danceName}"`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? t("deleting") : t("delete")}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
