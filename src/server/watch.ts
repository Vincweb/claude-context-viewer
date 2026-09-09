import fs from 'fs'
import path from 'path'
import { projectsHome } from './paths'

/** One refresh per burst: writing a transcript fires an event several times a turn. */
const SETTLE_MS = 800

type Listener = (slugs: string[]) => void

type Watch = {
  watcher: fs.FSWatcher
  listeners: Set<Listener>
  pending: Set<string>
  timer: NodeJS.Timeout | null
}

/**
 * One watcher per Claude folder, shared by every page looking at it. Watching is per folder rather
 * than per page because the platform hands out one recursive watch cheaply and a hundred of them
 * expensively.
 */
const watches = new Map<string, Watch>()

const start = (home: string): Watch | null => {
  const root = projectsHome(home)
  const listeners = new Set<Listener>()
  const state: Watch = {
    watcher: null as unknown as fs.FSWatcher,
    listeners,
    pending: new Set(),
    timer: null,
  }

  const flush = () => {
    state.timer = null
    const slugs = [...state.pending]
    state.pending.clear()
    for (const listener of listeners) listener(slugs)
  }

  try {
    state.watcher = fs.watch(root, { recursive: true }, (_event, filename) => {
      // The first segment of the path is the project folder. A null filename means the platform
      // could not say what changed, and an empty slug is how that is passed on: rescan the lot.
      const slug = filename ? (filename.split(path.sep)[0] ?? '') : ''
      state.pending.add(slug)
      if (!state.timer) {
        state.timer = setTimeout(flush, SETTLE_MS)
        // The server must still be able to exit while a burst is settling.
        state.timer.unref()
      }
    })
  } catch {
    // No watch available — a folder on a filesystem that cannot report changes, or too many
    // watches already open. The page falls back to reloading by hand, and says so.
    return null
  }

  state.watcher.on('error', () => {
    state.watcher.close()
    watches.delete(home)
    listeners.clear()
  })

  watches.set(home, state)
  return state
}

/**
 * Call `listener` with the project folders that changed, and return the function that stops
 * listening. The watcher itself is closed once nothing is listening to it any more.
 */
export const watchProjects = (home: string, listener: Listener) => {
  const state = watches.get(home) ?? start(home)
  if (!state) return null

  state.listeners.add(listener)
  return () => {
    state.listeners.delete(listener)
    if (state.listeners.size > 0) return
    if (state.timer) clearTimeout(state.timer)
    state.watcher.close()
    watches.delete(home)
  }
}
