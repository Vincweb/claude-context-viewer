import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

export type WatchStatus = 'connecting' | 'live' | 'off'

/**
 * How long the bar takes to fill before the page catches up on its own. Long enough to finish
 * reading a line, short enough that a page left alone is never far behind.
 */
export const APPLY_AFTER_MS = 9000

/** Keys that describe one project folder, and so go stale together when its files change. */
const PER_PROJECT = ['project', 'instructions', 'extras', 'session']

export type Watch = {
  status: WatchStatus
  /** Project folders changed since the last update, waiting to be taken in. */
  pending: number
  /** Take them in now, ahead of the bar. */
  apply: () => void
}

/**
 * Follows the Claude folder while the page is open, and holds what changed until it is asked for.
 *
 * The server watches the folder and names the project folders that changed; rather than swapping
 * the page out from under whoever is reading it, the change is counted and offered. The bar runs
 * for `APPLY_AFTER_MS` and then takes it in anyway, so a page left alone still keeps up.
 *
 * A slug the server could not name comes through empty, which stands for "something changed but
 * not what": everything for this folder is refreshed then, since guessing would be worse.
 */
export const useWatch = (home: string): Watch => {
  const client = useQueryClient()
  const [status, setStatus] = useState<WatchStatus>('connecting')
  const [pending, setPending] = useState(0)
  const slugs = useRef(new Set<string>())
  const timer = useRef<number | null>(null)

  const apply = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    const changed = [...slugs.current]
    slugs.current.clear()
    setPending(0)
    if (changed.length === 0) return

    // The list and the picker both count what is on disk, so any change touches them.
    void client.invalidateQueries({ queryKey: ['projects', home] })
    void client.invalidateQueries({ queryKey: ['homes'] })
    for (const slug of changed)
      for (const key of PER_PROJECT)
        void client.invalidateQueries({ queryKey: slug ? [key, home, slug] : [key, home] })
  }, [client, home])

  // The countdown fires from outside React, so it reaches the current `apply` through a ref.
  const latest = useRef(apply)
  useEffect(() => {
    latest.current = apply
  }, [apply])

  useEffect(() => {
    // The picker names no folder, so there is nothing to follow and no connection to open.
    if (!home) return

    // The set outlives every render, so the cleanup can hold on to this one safely.
    const batch = slugs.current
    const source = new EventSource(`/api/watch?home=${encodeURIComponent(home)}`)

    source.onopen = () => setStatus('live')

    // The server sends this and hangs up when the platform gives it no watch to use.
    source.addEventListener('unavailable', () => {
      setStatus('off')
      source.close()
    })

    source.onmessage = (event: MessageEvent<string>) => {
      setStatus('live')
      let changed: string[] = ['']
      try {
        const payload: unknown = JSON.parse(event.data)
        if (typeof payload === 'object' && payload !== null && 'slugs' in payload) {
          const found: unknown = payload.slugs
          if (Array.isArray(found))
            changed = found.filter((slug): slug is string => typeof slug === 'string')
        }
      } catch {
        // A malformed frame says nothing about which folder changed; treat it as "not sure".
      }

      for (const slug of changed) batch.add(slug)
      setPending(batch.size)
      // Later changes join the batch rather than pushing the bar back: a folder written to every
      // few seconds would otherwise hold the page at arm's length for as long as the work lasts.
      if (timer.current === null)
        timer.current = window.setTimeout(() => {
          timer.current = null
          latest.current()
        }, APPLY_AFTER_MS)
    }

    // EventSource reconnects on its own; this only reports that it is trying.
    source.onerror = () => {
      setStatus(source.readyState === EventSource.CLOSED ? 'off' : 'connecting')
    }

    return () => {
      source.close()
      if (timer.current !== null) {
        window.clearTimeout(timer.current)
        timer.current = null
      }
      batch.clear()
    }
  }, [home])

  // Reported as off on the picker, where no folder is named, whatever the last connection did.
  return { status: home ? status : 'off', pending, apply }
}
