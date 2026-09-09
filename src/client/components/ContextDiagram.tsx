import { GROUPS } from '../groups'
import { useT } from '../i18n'

const W = 400
const BAR = { x: 8, width: 384, height: 20 }
const ROW = 58

type Kind = 'startup' | 'you' | 'claude' | 'files' | 'summary'
type Segment = { kind: Kind; share: number }

/**
 * Four moments of one session, each the same box — the window does not grow. Shares are
 * illustrative: what matters is that the startup stack is there from the start and never moves,
 * that turns pile up to the right of it, and that a compaction folds the old turns into a short
 * summary and hands the room back. The words for each moment live in the dictionaries.
 */
const MOMENTS: Segment[][] = [
  [{ kind: 'startup', share: 0.16 }],
  [
    { kind: 'startup', share: 0.16 },
    { kind: 'you', share: 0.03 },
    { kind: 'claude', share: 0.05 },
    { kind: 'files', share: 0.14 },
    { kind: 'you', share: 0.02 },
    { kind: 'claude', share: 0.06 },
    { kind: 'files', share: 0.08 },
  ],
  [
    { kind: 'startup', share: 0.16 },
    { kind: 'you', share: 0.03 },
    { kind: 'claude', share: 0.05 },
    { kind: 'files', share: 0.14 },
    { kind: 'you', share: 0.02 },
    { kind: 'claude', share: 0.06 },
    { kind: 'files', share: 0.08 },
    { kind: 'you', share: 0.02 },
    { kind: 'claude', share: 0.05 },
    { kind: 'files', share: 0.17 },
    { kind: 'you', share: 0.02 },
    { kind: 'claude', share: 0.06 },
    { kind: 'files', share: 0.09 },
  ],
  [
    { kind: 'startup', share: 0.16 },
    { kind: 'summary', share: 0.1 },
    { kind: 'you', share: 0.02 },
    { kind: 'claude', share: 0.06 },
    { kind: 'files', share: 0.09 },
  ],
]

/** Warm neutrals for the conversation itself; the series purple keeps meaning "files read". */
const FILL: Record<Exclude<Kind, 'startup'>, string> = {
  you: 'var(--color-sand)',
  claude: 'var(--color-bark)',
  files: 'var(--color-series-runtime)',
  summary: 'url(#summary-hatch)',
}
const LEGEND: Exclude<Kind, 'startup'>[] = ['you', 'claude', 'files', 'summary']

const startup = GROUPS.filter((group) => group.key !== 'runtime')

export const ContextDiagram = () => {
  const t = useT()
  const height = 22 + MOMENTS.length * ROW + 8

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="mx-auto block w-full max-w-[520px]"
        role="img"
        aria-label={t.context.aria}
      >
        <defs>
          <pattern
            id="summary-hatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" fill="var(--color-bg)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-bark)" strokeWidth="2" />
          </pattern>
        </defs>

        <text x={BAR.x} y={14} className="fill-faint text-[11px] tracking-wide uppercase">
          {t.context.eyebrow}
        </text>

        {MOMENTS.map((segments, row) => {
          const words = t.context.moments[row] ?? { label: '', note: '' }
          const y = 26 + row * ROW
          let cursor = BAR.x
          const delay = 150 + row * 220
          return (
            <g key={row} className="animate-rise" style={{ animationDelay: `${delay}ms` }}>
              <text x={BAR.x} y={y + 10} className="fill-text text-[12px] font-medium">
                {words.label}
              </text>
              <rect
                x={BAR.x}
                y={y + 16}
                width={BAR.width}
                height={BAR.height}
                rx={6}
                fill="var(--color-bg)"
                stroke="var(--color-line-strong)"
                strokeWidth={1}
              />
              {segments.map((segment, index) => {
                const x = cursor
                const width = segment.share * BAR.width - 1.5
                cursor += segment.share * BAR.width
                if (segment.kind === 'startup') {
                  // The four startup groups, side by side, so the box's base reads as the stack.
                  let inner = x
                  return startup.map((group, k) => {
                    const part = width / startup.length
                    const gx = inner
                    inner += part
                    return (
                      <rect
                        key={group.key}
                        x={gx + (k === 0 ? 1 : 0.75)}
                        y={y + 17}
                        width={part - 1.5}
                        height={BAR.height - 2}
                        rx={k === 0 ? 5 : 2}
                        fill={group.color}
                        className="animate-grow-x origin-left-box"
                        style={{ animationDelay: `${delay + 80 + k * 40}ms` }}
                      />
                    )
                  })
                }
                return (
                  <rect
                    key={index}
                    x={x + 0.75}
                    y={y + 17}
                    width={width}
                    height={BAR.height - 2}
                    rx={3}
                    fill={FILL[segment.kind]}
                    className="animate-grow-x origin-left-box"
                    style={{ animationDelay: `${delay + 200 + index * 45}ms` }}
                  />
                )
              })}
              {row === 2 && (
                <text
                  x={BAR.x + BAR.width - 4}
                  y={y + 10}
                  textAnchor="end"
                  className="fill-accent text-[11px] font-medium"
                >
                  {t.context.compaction}
                </text>
              )}
              <text x={BAR.x} y={y + 50} className="fill-muted text-[11px]">
                {words.note}
              </text>
            </g>
          )
        })}
      </svg>

      <ul className="mx-auto mt-3 grid max-w-[520px] grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
        <li className="flex items-center gap-2">
          <span className="flex h-2.5 w-5 shrink-0 overflow-hidden rounded-sm" aria-hidden>
            {startup.map((group) => (
              <span key={group.key} className="h-full flex-1" style={{ background: group.color }} />
            ))}
          </span>
          <span className="text-muted">{t.context.legend.startup}</span>
        </li>
        {LEGEND.map((kind) => (
          <li key={kind} className="flex items-center gap-2">
            <span
              className="h-2.5 w-5 shrink-0 rounded-sm"
              style={
                kind === 'summary'
                  ? {
                      backgroundImage:
                        'repeating-linear-gradient(45deg, var(--color-bark) 0 1.5px, var(--color-bg) 1.5px 5px)',
                    }
                  : { background: FILL[kind] }
              }
              aria-hidden
            />
            <span className="text-muted">{t.context.legend[kind]}</span>
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span
            className="h-2.5 w-5 shrink-0 rounded-sm border border-line-strong bg-bg"
            aria-hidden
          />
          <span className="text-muted">{t.context.legend.free}</span>
        </li>
      </ul>
    </div>
  )
}
