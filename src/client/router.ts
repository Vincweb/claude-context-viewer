import { useSyncExternalStore } from 'react'
import { PROJECTS_PATH, PROJECT_PATH, SESSION_PATH } from '../shared/routes'

export type Route = {
  view: 'welcome' | 'projects' | 'project' | 'session'
  /** The Claude folder the URL carries; empty on the picker. */
  home: string
  slug: string
  id: string
}

const parse = (): Route => {
  const url = new URL(window.location.href)
  const pathname = url.pathname.replace(/\/+$/, '') || '/'
  const view =
    pathname === SESSION_PATH
      ? 'session'
      : pathname === PROJECT_PATH
        ? 'project'
        : pathname === PROJECTS_PATH
          ? 'projects'
          : 'welcome'
  return {
    view,
    home: url.searchParams.get('home') ?? '',
    slug: url.searchParams.get('slug') ?? '',
    id: url.searchParams.get('id') ?? '',
  }
}

/**
 * One snapshot for the whole page, kept at module level: a hook holding state of its own would
 * give every component a private copy of the URL, and they would drift apart on the first click.
 */
let route = parse()
const listeners = new Set<() => void>()

const publish = () => {
  route = parse()
  for (const listener of listeners) listener()
}

// The back and forward buttons change the URL without asking us.
window.addEventListener('popstate', publish)

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const useRoute = () => useSyncExternalStore(subscribe, () => route)

export const navigate = (to: string, { replace = false }: { replace?: boolean } = {}) => {
  if (replace) window.history.replaceState(null, '', to)
  else window.history.pushState(null, '', to)
  window.scrollTo({ top: 0 })
  publish()
}
