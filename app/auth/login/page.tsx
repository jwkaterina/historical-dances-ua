"use client"

import React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { Header } from "@/components/header"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isCredentialsError, setIsCredentialsError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  const isCredentials = (message: string) => {
    const msg = message.toLowerCase()
    return msg.includes("invalid login credentials") || msg.includes("invalid_credentials") || msg.includes("invalid email or password")
  }

  const getErrorMessage = (message: string): string => {
    const msg = message.toLowerCase()
    if (isCredentials(message)) return t("errorInvalidCredentials")
    if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) return t("errorEmailNotConfirmed")
    if (msg.includes("rate limit") || msg.includes("too many") || msg.includes("security purposes")) return t("errorRateLimit")
    if (msg.includes("invalid format") || msg.includes("invalid email")) return t("errorInvalidEmail")
    return t("errorDefault")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setIsCredentialsError(false)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/")
      router.refresh()
    } catch (error: unknown) {
      if (error instanceof Error) {
        setIsCredentialsError(isCredentials(error.message))
        setError(getErrorMessage(error.message))
      } else {
        setError(t("errorDefault"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex w-full items-center justify-center p-6 md:p-10 pt-20">
        <div className="w-full max-w-sm">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t("login")}</CardTitle>
              <CardDescription>{t("loginDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">{t("password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">
                      {error}{" "}
                      {isCredentialsError && (
                        <Link href="/auth/sign-up" className="underline underline-offset-4">
                          {t("errorInvalidCredentialsRegisterLink")}
                        </Link>
                      )}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t("loggingIn") : t("login")}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  {t("noAccount")}{" "}
                  <Link
                    href="/auth/sign-up"
                    className="underline underline-offset-4"
                  >
                    {t("signUp")}
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
