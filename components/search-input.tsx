"use client"

import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition, useRef, useEffect, useState } from "react"
import { useLanguage } from "@/components/language-provider"

interface SearchInputProps {
  placeholder?: string
}

export function SearchInput({ placeholder }: SearchInputProps) {
  const { t } = useLanguage()
  const defaultPlaceholder = t("search")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const [inputValue, setInputValue] = useState("")

  // Initialize input value from URL on mount
  useEffect(() => {
    setInputValue(searchParams.get("q") || "")
  }, [])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  const handleSearch = (value: string) => {
    // Update local state immediately for better UX
    setInputValue(value)

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new debounce timer for URL update
    debounceTimerRef.current = setTimeout(() => {
      startTransition(() => {
        router.replace(`${pathname}?${createQueryString("q", value)}`)
      })
    }, 300) // 300ms debounce delay
  }

  const clearSearch = () => {
    setInputValue("")
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    startTransition(() => {
      router.replace(pathname)
    })
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder || defaultPlaceholder}
        value={inputValue}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9 pr-9"
      />
      {inputValue && (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={t("clearSearch")}
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {isPending && inputValue && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      )}
    </div>
  )
}
