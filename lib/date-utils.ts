import { format } from "date-fns"
import { uk, ru } from "date-fns/locale"

export function formatDate(dateString: string, language: "ua" | "ru"): string {
  try {
    const date = new Date(dateString)
    const locale = language === "ru" ? ru : uk
    return format(date, "PPP", { locale })
  } catch (error) {
    return dateString
  }
}
