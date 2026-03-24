"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { saveFAQs } from "@/app/actions/faqs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ArrowLeft, Edit, Plus, Trash2 } from "lucide-react"

interface Faq {
  id: string
  question_ua: string
  question_ru: string
  answer_ua: string
  answer_ru: string
  order_index: number
}

interface EditableFaq {
  question_ua: string
  question_ru: string
  answer_ua: string
  answer_ru: string
}

interface FaqContentProps {
  faqs: Faq[]
  fromBallName?: string
}

export function FaqContent({ faqs, fromBallName }: FaqContentProps) {
  const { t, language } = useLanguage()
  const { isAdmin, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [items, setItems] = useState<EditableFaq[]>(
    faqs.map(f => ({
      question_ua: f.question_ua,
      question_ru: f.question_ru,
      answer_ua: f.answer_ua,
      answer_ru: f.answer_ru,
    }))
  )

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveFAQs(items.map((item, idx) => ({ ...item, order_index: idx })))
      toast({ title: t("toastSuccess"), description: t("faqSaved") })
      setIsEditing(false)
      router.refresh()
    } catch {
      toast({ title: t("toastError"), description: t("faqSaveFailed"), variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setItems(faqs.map(f => ({
      question_ua: f.question_ua,
      question_ru: f.question_ru,
      answer_ua: f.answer_ua,
      answer_ru: f.answer_ru,
    })))
  }

  const addItem = () => {
    setItems([...items, { question_ua: "", question_ru: "", answer_ua: "", answer_ru: "" }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof EditableFaq, value: string) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{fromBallName || t("backToBalls")}</span>
        </Button>
        {isAdmin && !isEditing && (
          <Button onClick={() => setIsEditing(true)} className="animate-in fade-in duration-300">
            <Edit className="sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t("editFAQ")}</span>
          </Button>
        )}
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground">{t("faqs")}</h1>
        <p className="mt-2 text-muted-foreground">{t("faqsDescription")}</p>
      </div>

      {isEditing ? (
        <div className="space-y-6">
          {items.map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("questionLabel")} {index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Українська</label>
                    <Input
                      value={item.question_ua}
                      onChange={e => updateItem(index, "question_ua", e.target.value)}
                      placeholder={t("questionLabel")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Русский</label>
                    <Input
                      value={item.question_ru}
                      onChange={e => updateItem(index, "question_ru", e.target.value)}
                      placeholder={t("questionLabel")}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("answerLabel")} — Українська</label>
                    <RichTextEditor
                      content={item.answer_ua}
                      onChange={value => updateItem(index, "answer_ua", value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("answerLabel")} — Русский</label>
                    <RichTextEditor
                      content={item.answer_ru}
                      onChange={value => updateItem(index, "answer_ru", value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addItem} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            {t("addFAQ")}
          </Button>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t("saving") : t("save")}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      ) : faqs.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">{t("noFaqsYet")}</p>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {faqs.map(faq => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left">
                {language === "ru" ? faq.question_ru : faq.question_ua}
              </AccordionTrigger>
              <AccordionContent>
                <div
                  className="tiptap prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: language === "ru" ? faq.answer_ru : faq.answer_ua,
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
