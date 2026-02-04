"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { Header } from "@/components/header"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function ErrorContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t("authErrorTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-muted-foreground">
            {t("errorCode")}: {error}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("unspecifiedError")}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex w-full items-center justify-center p-6 md:p-10 pt-20">
        <div className="w-full max-w-sm">
          <Suspense fallback={null}>
            <ErrorContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
