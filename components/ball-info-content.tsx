'use client'

import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RichTextEditor } from "@/components/rich-text-editor"
import { updateBallInfo } from "@/app/actions/ball"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Edit } from "lucide-react"
import { useState } from "react"

interface BallInfoContentProps {
  ball: {
    id: string
    name: string
    name_de: string | null
    name_ru: string | null
    info_text: string | null
  }
}

export function BallInfoContent({ ball }: BallInfoContentProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { isAdmin } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(ball.info_text || '')
  const [isSaving, setIsSaving] = useState(false)

  const displayName = language === "ru"
      ? (ball.name_ru || ball.name)
      : (ball.name_de || ball.name)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateBallInfo(ball.id, content)
      toast({
        title: t("success"),
        description: t("ballInfoSaved"),
      })
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Save ball info error:", error)
      toast({
        title: t("error"),
        description: t("ballInfoSaveFailed"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToBall")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
          <p className="text-xl text-muted-foreground mt-2">{t("ballInfo")}</p>
        </div>
        {isAdmin && !isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            {t("editBallInfo")}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("ballInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <RichTextEditor content={content} onChange={setContent} />
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? t("saving") : t("saveBallInfo")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setContent(ball.info_text || '')
                  }}
                  disabled={isSaving}
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {content ? (
                <div
                  className="tiptap"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <p className="text-muted-foreground">
                  {isAdmin ? t("editBallInfo") : t("ballInfo")}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
