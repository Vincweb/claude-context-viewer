import { useSyncExternalStore } from 'react'
import { en } from './en'
import { fr } from './fr'

export type Lang = 'en' | 'fr'
export type { Strings } from './en'

export const LANGS: Lang[] = ['en', 'fr']
const STRINGS = { en, fr }
const STORAGE_KEY = 'claude-context.lang'

/** What was chosen last time, else what the browser speaks, else English. */
const detect = (): Lang => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'fr') return saved
  } catch {
    // Storage can be off; the browser's language is a fine default.
  }
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

/**
 * One language for the whole page, kept at module level like the route: every component reads
 * the same value and re-renders together when it changes.
 */
let lang = detect()
document.documentElement.lang = lang
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const currentLang = () => lang

export const setLang = (next: Lang) => {
  if (next === lang) return
  lang = next
  document.documentElement.lang = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Not remembering the choice is the only consequence.
  }
  for (const listener of listeners) listener()
}

export const useLang = () => useSyncExternalStore(subscribe, () => lang)

/** The dictionary for the current language; re-renders the caller when it changes. */
export const useT = () => STRINGS[useLang()]

/** Text the server wrote in English, translated when a line for it exists. */
export const serverText = (map: Record<string, string>, text: string) => map[text] ?? text
