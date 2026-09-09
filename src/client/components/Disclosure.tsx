import { useState, type ReactNode } from 'react'
import { cx } from '../cx'

/**
 * A row that opens. Children are a function so a closed row never builds its contents — a session
 * holds a few hundred kilobytes of text across its layers, and rendering all of it up front is
 * what would make this page slow.
 */
export const Disclosure = ({
  summary,
  children,
  defaultOpen = false,
  className,
}: {
  summary: (open: boolean) => ReactNode
  children: () => ReactNode
  defaultOpen?: boolean
  className?: string
}) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-code-bg"
      >
        <span
          className={cx(
            'inline-block w-3 select-none text-center text-muted transition-transform duration-200',
            open && 'rotate-90',
          )}
          aria-hidden
        >
          ›
        </span>
        <span className="min-w-0 flex-1">{summary(open)}</span>
      </button>
      {open && <div className="animate-unfold border-t border-line">{children()}</div>}
    </div>
  )
}
