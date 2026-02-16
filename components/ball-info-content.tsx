"use client"

import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RichTextEditor } from "@/components/rich-text-editor"
import { updateBallInfo } from "@/app/actions/ball"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { ArrowLeft, Edit } from "lucide-react"
import React, { useEffect, useState } from "react"

interface BallInfoContentProps {
  ball: {
    id: string
    name: string
    name_de: string | null
    name_ru: string | null
    info_de: string | null
    info_ru: string | null
  }
}

export function BallInfoContent({ ball }: BallInfoContentProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { isAdmin } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const [contentDe, setContentDe] = useState<string>(ball.info_de || "")
  const [contentRu, setContentRu] = useState<string>(ball.info_ru || "")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setContentDe(ball.info_de || "")
    setContentRu(ball.info_ru || "")
  }, [ball.info_de, ball.info_ru, ball.id])

  const displayName =
      language === "ru" ? (ball.name_ru || ball.name) : (ball.name_de || ball.name)

  const displayContent = language === "ru" ? (ball.info_ru || "") : (ball.info_de || "")

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateBallInfo(ball.id, contentDe, contentRu)
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
            <p className="text-xl text-muted-foreground mt-2">{t("ballRules")}</p>
          </div>

          {isAdmin && !isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                {t("editBallInfo")}
              </Button>
          )}
        </div>

        <Card>
          <CardContent>
            {isEditing ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Deutsch</h3>
                    <RichTextEditor content={contentDe} onChange={setContentDe} />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Русский</h3>
                    <RichTextEditor content={contentRu} onChange={setContentRu} />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? t("saving") : t("saveBallInfo")}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setContentDe(ball.info_de || "")
                          setContentRu(ball.info_ru || "")
                        }}
                        disabled={isSaving}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
            ) : (
                <div>
                  {displayContent ? (
                      <div className="tiptap" dangerouslySetInnerHTML={{ __html: displayContent }} />
                  ) : (
                      <p className="text-muted-foreground">
                        {isAdmin ? t("editBallInfo") : t("ballRules")}
                      </p>
                  )}
                </div>
            )}
          </CardContent>
        </Card>
      </div>
  )
}
