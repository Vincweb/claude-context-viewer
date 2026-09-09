import { useEffect, useRef } from 'react'
import { useT } from '../i18n'
import { APPLY_AFTER_MS, type Watch } from '../watch'

/**
 * Offered rather than applied: something on disk changed, and the table takes it in when the bar
 * runs out or the moment this is clicked. Disabled while there is nothing waiting, so the control
 * stays in place and its state is the answer to "is what I am looking at current".
 *
 * The bar is the countdown made visible, so it is drawn only where motion is wanted; the countdown
 * itself runs either way. It starts when a batch opens, not on every change that joins it.
 */
export const UpdateButton = ({ watch }: { watch: Watch }) => {
  const t = useT()
  const bar = useRef<HTMLSpanElement>(null)
  const waiting = watch.pending > 0
  // Nothing to offer and no way to learn of anything: say so, or the button reads as "current"
  // while the page quietly stops keeping up.
  const blind = !waiting && watch.status === 'off'

  useEffect(() => {
    const element = bar.current
    if (!element || !waiting || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return
    const filling = element.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
      duration: APPLY_AFTER_MS,
      easing: 'linear',
      fill: 'forwards',
    })
    return () => filling.cancel()
  }, [waiting])

  return (
    <button
      type="button"
      onClick={watch.apply}
      disabled={!waiting}
      // The glyph carries no meaning on its own, so the name and the detail are both spelled out.
      aria-label={waiting ? t.projects.update : blind ? t.projects.watchOff : t.projects.upToDate}
      title={
        waiting
          ? t.projects.updateHint(watch.pending)
          : blind
            ? t.projects.watchOffHint
            : t.projects.upToDateHint
      }
      className="relative shrink-0 overflow-hidden rounded-lg border border-line bg-panel px-2.5 py-1.5 leading-5 transition-colors not-disabled:hover:border-line-strong disabled:text-faint"
    >
      {waiting && (
        <span
          ref={bar}
          aria-hidden
          className="absolute inset-y-0 left-0 w-full origin-left bg-accent-soft"
        />
      )}
      <span aria-hidden className="relative">
        ↻
      </span>
    </button>
  )
}
