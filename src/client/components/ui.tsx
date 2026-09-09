import { useState, type CSSProperties, type ReactNode } from 'react'
import { cx } from '../cx'
import { useT } from '../i18n'
import { navigate } from '../router'

export const Panel = ({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) => (
  <div
    className={cx('rounded-xl border border-line bg-panel shadow-card', className)}
    style={style}
  >
    {children}
  </div>
)

/**
 * Enters from just below. `index` staggers a list, capped so a hundred rows do not take four
 * seconds to arrive — past the tenth everything lands together.
 */
export const Rise = ({
  children,
  index = 0,
  className,
}: {
  children: ReactNode
  index?: number
  className?: string
}) => (
  <div
    className={cx('animate-rise', className)}
    style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
  >
    {children}
  </div>
)

export const Muted = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cx('text-muted', className)}>{children}</span>
)

export const Mono = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cx('font-mono text-[12px]', className)}>{children}</span>
)

export const Eyebrow = ({ children }: { children: ReactNode }) => (
  <p className="mb-2 text-[11px] tracking-wide text-faint uppercase">{children}</p>
)

export const Badge = ({
  children,
  tone = 'plain',
}: {
  children: ReactNode
  tone?: 'plain' | 'warn' | 'accent'
}) => (
  <span
    className={cx(
      'rounded-full border px-2 py-px text-[11px] leading-4 whitespace-nowrap',
      tone === 'warn' && 'border-warn-line bg-warn-bg text-text',
      tone === 'accent' && 'border-transparent bg-accent-soft text-accent',
      tone === 'plain' && 'border-line bg-code-bg text-muted',
    )}
  >
    {children}
  </span>
)

/** A number worth reading on its own, with the words that make it mean something. */
export const Stat = ({ value, label }: { value: ReactNode; label: ReactNode }) => (
  <div>
    <div className="text-[20px] leading-tight font-semibold tabular-nums tracking-tight">
      {value}
    </div>
    <div className="text-muted">{label}</div>
  </div>
)

export const Button = ({
  children,
  onClick,
  type = 'button',
  primary = false,
  disabled = false,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  primary?: boolean
  disabled?: boolean
  className?: string
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={cx(
      'rounded-lg border px-3 py-1.5 font-medium transition-colors disabled:opacity-50',
      primary
        ? 'border-accent bg-accent text-white hover:brightness-110'
        : 'border-line bg-panel text-text hover:bg-code-bg',
      className,
    )}
  >
    {children}
  </button>
)

/**
 * Copies text, and says so for a moment. The clipboard is refused in a few contexts — so the
 * fallback is `onRefused`, which the caller uses to select the field holding the same text, and a
 * keyboard copy still works.
 */
export const CopyButton = ({
  text,
  label,
  done,
  onRefused,
}: {
  text: string
  label: string
  done: string
  onRefused?: () => void
}) => {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      primary
      onClick={() => {
        navigator.clipboard.writeText(text).then(
          () => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
          },
          () => onRefused?.(),
        )
      }}
    >
      {copied ? `${done} ✓` : label}
    </Button>
  )
}

/** An in-page link: the router owns the URL, so a plain anchor would reload everything. */
export const Link = ({
  to,
  children,
  className,
  title,
  label,
}: {
  to: string
  children: ReactNode
  className?: string
  /** For a link whose text is an icon, and which therefore needs naming another way. */
  title?: string
  label?: string
}) => (
  <a
    href={to}
    title={title}
    aria-label={label}
    className={cx('text-accent transition-colors hover:text-clay', className)}
    onClick={(event) => {
      // Let the browser have the clicks that mean "somewhere else": a new tab, a download.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
      event.preventDefault()
      navigate(to)
    }}
  >
    {children}
  </a>
)

/**
 * Up one level: the projects list from a project, the project from a session. A real link rather
 * than the browser's history, so it points somewhere known on a page opened cold from a shared
 * URL, and answers a cmd-click like any other link.
 */
export const BackLink = ({ to, label }: { to: string; label: string }) => (
  <Link
    to={to}
    label={label}
    title={label}
    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-panel !text-muted no-underline shadow-card transition-colors hover:bg-code-bg hover:!text-text"
  >
    <span aria-hidden className="text-[14px] leading-none">
      ←
    </span>
  </Link>
)

export const Loading = ({ what }: { what: string }) => {
  const t = useT()
  return <p className="animate-rise px-1 py-10 text-muted">{t.ui.reading(what)}</p>
}

export const Failed = ({ error }: { error: unknown }) => {
  const t = useT()
  return (
    <Panel className="animate-rise border-warn-line bg-warn-bg p-4">
      <p className="font-medium">{t.ui.couldNotRead}</p>
      <p className="mt-1 text-muted">{error instanceof Error ? error.message : String(error)}</p>
    </Panel>
  )
}
