import { format } from "date-fns"
import { de, ru } from "date-fns/locale"

export function formatDate(dateString: string, language: "de" | "ru"): string {
  try {
    const date = new Date(dateString)
    const locale = language === "ru" ? ru : de
    return format(date, "PPP", { locale })
  } catch (error) {
    return dateString
  }
}
