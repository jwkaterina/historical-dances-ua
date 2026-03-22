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

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  const getErrorMessage = (message: string): string => {
    const msg = message.toLowerCase()
    if (msg.includes("user already registered") || msg.includes("already been registered") || msg.includes("already exists")) return t("errorUserAlreadyExists")
    if (msg.includes("password") && (msg.includes("short") || msg.includes("characters") || msg.includes("weak"))) return t("errorWeakPassword")
    if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) return t("errorEmailNotConfirmed")
    if (msg.includes("rate limit") || msg.includes("too many") || msg.includes("security purposes")) return t("errorRateLimit")
    if (msg.includes("invalid format") || msg.includes("unable to validate email") || msg.includes("invalid email")) return t("errorInvalidEmail")
    return t("errorDefault")
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError(t("passwordsNoMatch"))
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      // When email enumeration protection is on, Supabase returns a fake user
      // with empty identities instead of an error for already-registered emails
      if (data.user && data.user.identities?.length === 0) {
        setError(t("errorUserAlreadyExists"))
        return
      }
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? getErrorMessage(error.message) : t("errorDefault"))
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
              <CardTitle className="text-2xl">{t("signUp")}</CardTitle>
              <CardDescription>{t("signUpDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
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
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password">{t("repeatPassword")}</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t("signingUp") : t("signUp")}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  {t("hasAccount")}{" "}
                  <Link
                    href="/auth/login"
                    className="underline underline-offset-4"
                  >
                    {t("login")}
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
