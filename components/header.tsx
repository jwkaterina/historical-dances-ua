"use client"

import Link from "next/link"
import { useState } from "react"
import { useLanguage } from "@/components/language-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { AuthButton } from "@/components/auth-button"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

export function Header() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="text-lg font-semibold text-foreground sm:text-xl">
          {t("appName")}
        </Link>
        
        {/* Desktop navigation */}
        <div className="hidden sm:flex items-center gap-4">
          <nav className="flex gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("dances")}
            </Link>
            <Link
              href="/music"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("music")}
            </Link>
            <Link
              href="/balls"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("ballsTitle")}
            </Link>
          </nav>
          <LanguageSwitcher />
          <AuthButton />
        </div>

        {/* Mobile navigation */}
        <div className="flex sm:hidden items-center gap-2">
          <LanguageSwitcher />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-6">
              <nav className="flex flex-col gap-4 mt-6">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-primary"
                >
                  {t("dances")}
                </Link>
                <Link
                  href="/music"
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-primary"
                >
                  {t("music")}
                </Link>
                <Link
                  href="/balls"
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-primary"
                >
                  {t("ballsTitle")}
                </Link>
                <div className="pt-4 border-t border-border">
                  <AuthButton />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
