import { GROUPS } from '../groups'
import { useT } from '../i18n'

const BAND = { width: 200, height: 46, gap: 10, x: 8 }
const LABEL_X = BAND.x + BAND.width + 18
const TOP = 26
/** Room under the startup bands for the rule and its two-line caption. */
const CAPTION = 40

/**
 * What each band looks like from the inside: the first words of a layer, set in mono. Left in
 * English whatever the page speaks — that is the language the real layers are written in.
 */
const SNIPPETS: Record<string, string> = {
  system: 'You are Claude Code…',
  instructions: '# CLAUDE.md  Use pnpm, never…',
  capabilities: 'Read · Edit · Bash · Grep · …',
  session: 'cwd, platform, model, today',
  runtime: '<tool_result> src/scan.ts …',
}

/**
 * The layers in the order the model reads them, top to bottom: the system prompt first, the
 * session's own settings last, and under them all the layer that keeps growing while the work
 * happens — drawn hollow, because it is not there when the session opens. Heights are equal on
 * purpose: this says *what* is there, not how much of it. The real proportions are measured, and
 * live on a session's own page.
 */
export const StackDiagram = () => {
  const t = useT()
  const startup = GROUPS.filter((group) => group.key !== 'runtime')
  const runtime = GROUPS.find((group) => group.key === 'runtime')

  const yOf = (index: number) => TOP + index * (BAND.height + BAND.gap)
  const ruleY = yOf(startup.length) - BAND.gap + 8
  const runtimeY = ruleY + CAPTION
  const height = runtimeY + BAND.height + 34

  return (
    <svg
      viewBox={`0 0 400 ${height}`}
      className="mx-auto block w-full max-w-[440px]"
      role="img"
      aria-label={t.stack.aria}
    >
      <defs>
        <clipPath id="band-clip">
          <rect x={BAND.x} y={0} width={BAND.width - 8} height={height} />
        </clipPath>
      </defs>

      <text x={BAND.x} y={14} className="fill-faint text-[11px] tracking-wide uppercase">
        {t.stack.eyebrow}
      </text>

      {startup.map((group, index) => {
        const y = yOf(index)
        return (
          <g
            key={group.key}
            className="animate-rise"
            style={{ animationDelay: `${120 + index * 110}ms` }}
          >
            <rect
              x={BAND.x}
              y={y}
              width={BAND.width}
              height={BAND.height}
              rx={8}
              fill={group.color}
            />
            <text
              x={BAND.x + 12}
              y={y + BAND.height / 2 + 4}
              className="font-mono text-[10.5px]"
              fill="#faf9f5"
              clipPath="url(#band-clip)"
            >
              {SNIPPETS[group.key]}
            </text>
            <text x={LABEL_X} y={y + 18} className="fill-text text-[12.5px] font-medium">
              {t.groups[group.key].short}
            </text>
            <text x={LABEL_X} y={y + 35} className="fill-muted text-[11px]">
              {t.stack.hints[group.key]}
            </text>
          </g>
        )
      })}

      {/* A bracket along the startup bands and a rule under them: these four leave together. */}
      <g className="animate-rise" style={{ animationDelay: `${120 + startup.length * 110}ms` }}>
        <path
          d={`M ${BAND.x - 2} ${yOf(0)} h -4 v ${
            startup.length * (BAND.height + BAND.gap) - BAND.gap
          } h 4`}
          fill="none"
          className="stroke-line-strong"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <line
          x1={BAND.x}
          x2={BAND.x + BAND.width}
          y1={ruleY}
          y2={ruleY}
          className="stroke-line-strong"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <text x={BAND.x} y={ruleY + 15} className="fill-text text-[11px] font-medium">
          {t.stack.caption1}
        </text>
        <text x={BAND.x} y={ruleY + 28} className="fill-faint text-[10.5px]">
          {t.stack.caption2}
        </text>
      </g>

      {runtime && (
        <g
          className="animate-rise"
          style={{ animationDelay: `${120 + (startup.length + 1) * 110}ms` }}
        >
          <rect
            x={BAND.x}
            y={runtimeY}
            width={BAND.width}
            height={BAND.height}
            rx={8}
            fill={runtime.color}
            fillOpacity={0.12}
            stroke={runtime.color}
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <text
            x={BAND.x + 12}
            y={runtimeY + BAND.height / 2 + 4}
            className="font-mono text-[10.5px]"
            fill={runtime.color}
            clipPath="url(#band-clip)"
          >
            {SNIPPETS.runtime}
          </text>
          <text x={LABEL_X} y={runtimeY + 18} className="fill-text text-[12.5px] font-medium">
            {t.groups.runtime.short}
          </text>
          <text x={LABEL_X} y={runtimeY + 35} className="fill-muted text-[11px]">
            {t.stack.hints.runtime}
          </text>
          {/* Down, because this layer only ever gets longer as the conversation goes on. */}
          <path
            d={`M ${BAND.x + BAND.width / 2} ${runtimeY + BAND.height + 8} v 14 m -4 -4 l 4 4 l 4 -4`}
            fill="none"
            stroke={runtime.color}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  )
}
