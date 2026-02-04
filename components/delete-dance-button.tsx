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
}

export function DeleteDanceButton({ danceId, danceName }: DeleteDanceButtonProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const { isAdmin, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteDance(danceId)
      toast({
        title: t("toastSuccess"),
        description: t("toastDanceDeleted"),
      })
      router.push("/")
    } catch (error) {
      console.error("[v0] Error deleting dance:", error)
      toast({
        title: t("toastError"),
        description: error instanceof Error ? error.message : t("toastFailedDeleteDance"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Only show for admins
  if (authLoading || !isAdmin) {
    return null
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          {t("deleteDance")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteConfirmMessage")} {`"${danceName}"`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3">
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
