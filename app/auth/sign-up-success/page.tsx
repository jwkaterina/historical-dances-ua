"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { Header } from "@/components/header"

export default function SignUpSuccessPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex w-full items-center justify-center p-6 md:p-10 pt-20">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t("signUpSuccess")}</CardTitle>
              <CardDescription>{t("checkEmail")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t("signUpSuccessMessage")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
