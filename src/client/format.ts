import { useT } from './i18n'

export const bytes = (value: number) => {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} kB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

/** Token counts are estimates, and a rounded thousand says that better than a precise number. */
export const tokens = (value: number) =>
  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)

/** A date the way one language says it: a time today, a count of days this week, a date beyond. */
export const when = (iso: string | null, daysAgo: (n: number) => string, locale: string) => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  const days = (Date.now() - date.getTime()) / 86_400_000
  if (days < 1) return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  if (days < 7) return daysAgo(Math.floor(days))
  return date.toLocaleDateString(locale)
}

/** `when`, bound to the current language. */
export const useWhen = () => {
  const t = useT()
  return (iso: string | null) => when(iso, t.format.daysAgo, t.locale)
}

export const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max)}…` : value
