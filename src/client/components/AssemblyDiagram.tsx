import { GROUPS } from '../groups'
import { useT } from '../i18n'

/**
 * The first lines of each layer, as they sit in the one text the model receives. English on
 * purpose: that is what the real layers say.
 */
const LINES: Record<string, string[]> = {
  system: [
    'You are Claude Code, Anthropic’s official CLI for Claude.',
    'You are an interactive agent that helps users with…',
  ],
  instructions: ['# CLAUDE.md', 'Use pnpm, never npm. Run `pnpm check` before…'],
  capabilities: [
    'Tools: Read, Edit, Bash, Grep, WebSearch, Agent…',
    'Skills: /commit, /review, /deploy…',
  ],
  session: [
    'cwd: ~/Documents/Vincweb/claude-context-viewer',
    'platform: darwin · model: claude-fable-5-1 · today: 2026-09-09',
  ],
}

/**
 * The same four layers, read the way the model reads them: top to bottom, as one document, your
 * message last. A stack says what is there; this says in what order it arrives. Each layer sits
 * on a wash of its own colour, so the document reads as the stack it came from.
 */
export const AssemblyDiagram = () => {
  const t = useT()
  const startup = GROUPS.filter((group) => group.key !== 'runtime')

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line bg-bg px-3 py-1.5">
        <span className="text-[11px] tracking-wide text-faint uppercase">{t.assembly.eyebrow}</span>
        <span className="text-[11px] text-faint">{t.assembly.toModel}</span>
      </div>
      <ol>
        {startup.map((group, index) => (
          <li
            key={group.key}
            className="animate-rise flex gap-3 px-3 py-2.5"
            style={{
              animationDelay: `${150 + index * 120}ms`,
              background: `color-mix(in srgb, ${group.color} 9%, white)`,
            }}
          >
            <span
              className="mt-0.5 w-1 shrink-0 self-stretch rounded-full"
              style={{ background: group.color }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium" style={{ color: group.color }}>
                {t.groups[group.key].short}
              </p>
              {(LINES[group.key] ?? []).map((line) => (
                <p key={line} className="truncate font-mono text-[11.5px] text-muted">
                  {line}
                </p>
              ))}
            </div>
          </li>
        ))}
        <li
          className="animate-rise flex gap-3 border-t border-dashed border-line-strong px-3 py-2.5"
          style={{ animationDelay: `${150 + startup.length * 120}ms` }}
        >
          <span className="mt-0.5 w-1 shrink-0 self-stretch rounded-full bg-text" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-text">{t.assembly.firstMessage}</p>
            <p className="truncate font-mono text-[11.5px] text-muted">{t.assembly.example}</p>
          </div>
        </li>
      </ol>
    </div>
  )
}
