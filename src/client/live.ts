import { useLayoutEffect, useRef } from 'react'

/** Long enough to read as travel, short enough not to be waited on. */
const MIN_MS = 380
const MAX_MS = 780
/** Most of the distance is covered early, then it settles: the curve that reads as weight. */
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'
/** A row further down the list starts a little later, so the reflow arrives as one wave. */
const STAGGER_MS = 26
const MAX_STAGGER_MS = 120

const stillWants = () =>
  typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Makes the table move rather than jump: a row whose place in the order changed travels from where
 * it was to where it now is, a row that has just appeared fades in, and the rows a move displaced
 * follow it in a wave.
 *
 * How far a row travelled is only knowable once the browser has laid the new order out, so this
 * runs in a layout effect and animates from the DOM: measure, then start each row back at its old
 * offset and let it come home. Time is spent in proportion to distance — a row crossing the table
 * would look hurried at the same duration as one shifting by a line. Nothing here carries
 * information the still table lacks, so all of it is skipped under `prefers-reduced-motion`, which
 * this API, unlike a CSS animation, does not honour on its own.
 */
export const useLiveRows = (keys: string[]) => {
  const elements = useRef(new Map<string, HTMLElement>())
  const tops = useRef(new Map<string, number>())
  const mounted = useRef(false)

  // The identity of the array changes every render; the order of its contents is what matters.
  const signature = keys.join(',')

  useLayoutEffect(() => {
    const animate = stillWants()
    const nextTops = new Map<string, number>()
    const moved: { element: HTMLElement; from: number; to: number; index: number }[] = []

    keys.forEach((key, index) => {
      const element = elements.current.get(key)
      if (!element) return

      const top = element.getBoundingClientRect().top
      nextTops.set(key, top)
      if (!animate) return

      const before = tops.current.get(key)
      if (before === undefined) {
        // New since the last pass. On the very first pass every row is new, and the table has its
        // own entrance for that; only a row that arrived later gets this one.
        if (mounted.current)
          element.animate(
            [
              { opacity: '0', transform: 'translateY(-8px)' },
              { opacity: '1', transform: 'none' },
            ],
            { duration: 340, easing: EASE },
          )
        return
      }
      if (Math.abs(before - top) > 1) moved.push({ element, from: before, to: top, index })
    })

    if (moved.length > 0) {
      // The row that travelled furthest sets the pace; the rest keep to it, so the whole reflow
      // finishes together instead of some rows still drifting after the others have settled.
      const furthest = Math.max(...moved.map((row) => Math.abs(row.from - row.to)))
      const duration = Math.min(MAX_MS, Math.max(MIN_MS, 340 + furthest * 0.55))
      const first = Math.min(...moved.map((row) => row.index))
      for (const row of moved)
        row.element.animate(
          [{ transform: `translateY(${row.from - row.to}px)` }, { transform: 'none' }],
          {
            duration,
            easing: EASE,
            delay: Math.min((row.index - first) * STAGGER_MS, MAX_STAGGER_MS),
            fill: 'backwards',
          },
        )
    }

    tops.current = nextTops
    mounted.current = true
    // Positions are read from the DOM, so the effect has to re-run whenever the rendered order
    // differs — by order or by membership.
  }, [signature, keys])

  /** Hand this to each row's `ref`, so the hook can measure and animate it. */
  return (key: string) => (element: HTMLElement | null) => {
    if (element) elements.current.set(key, element)
    else elements.current.delete(key)
  }
}
