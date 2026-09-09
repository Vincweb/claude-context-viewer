import { useEffect, useRef, type ReactNode } from 'react'
import { useT } from '../i18n'

/**
 * A native dialog: the browser owns focus, Escape and the backdrop. `open` is the only state; the
 * element is told to match it, and tells us back through `onClose` when the user dismisses it.
 */
export const Modal = ({
  open,
  onClose,
  onBack,
  title,
  subtitle,
  children,
}: {
  open: boolean
  onClose: () => void
  /** Shown as a back arrow when the dialog holds a stack of frames. */
  onBack?: () => void
  title: string
  subtitle?: ReactNode
  children: ReactNode
}) => {
  const t = useT()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // The dialog itself is only ever hit through its backdrop; the content sits in a child.
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
      className="m-auto w-[min(780px,92vw)] rounded-xl border border-line bg-panel p-0 text-text shadow-lift backdrop:bg-text/25 open:animate-pop"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="flex min-w-0 items-start gap-2.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label={t.link.back}
              className="mt-0.5 rounded-md border border-line px-1.5 py-px text-[13px] leading-5 text-muted transition-colors hover:bg-code-bg hover:text-text"
            >
              ←
            </button>
          )}
          <div className="min-w-0">
            <h2 className="font-serif text-[20px] leading-tight tracking-tight break-words">
              {title}
            </h2>
            {subtitle && <div className="mt-1 min-w-0 text-muted">{subtitle}</div>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.fix.close}
          className="-mr-1 rounded-md px-2 text-[18px] leading-none text-muted transition-colors hover:bg-code-bg hover:text-text"
        >
          ×
        </button>
      </div>
      <div className="max-h-[75vh] overflow-auto px-5 py-4">{children}</div>
    </dialog>
  )
}
