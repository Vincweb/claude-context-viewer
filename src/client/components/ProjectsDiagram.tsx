import { useT } from '../i18n'
import { Badge } from './ui'

type Tone = 'folder' | 'transcript' | 'memory'

const TONE: Record<Tone, string> = {
  folder: 'text-text',
  transcript: 'text-series-system',
  memory: 'text-series-instructions',
}

/**
 * The Claude folder as a tree, one made-up project in it, so the table beneath has a picture to
 * lean on: what a "project folder" is, where the sessions and the memory live, and why a worktree
 * and a throwaway directory each get a folder of their own.
 */
export const ProjectsDiagram = () => {
  const t = useT()
  const d = t.projects.diagram
  const rows: { prefix: string; name: string; note: string; tone: Tone; badge?: string }[] = [
    { prefix: '', name: '~/.claude/projects/', note: d.root, tone: 'folder' },
    { prefix: '├─ ', name: '-Users-you-code-app/', note: d.folder, tone: 'folder' },
    { prefix: '│  ├─ ', name: '3f2a….jsonl', note: d.transcript, tone: 'transcript' },
    { prefix: '│  ├─ ', name: '9c1b….jsonl', note: '', tone: 'transcript' },
    { prefix: '│  └─ ', name: 'memory/', note: d.memoryDir, tone: 'memory' },
    { prefix: '│     ├─ ', name: 'MEMORY.md', note: d.index, tone: 'memory' },
    { prefix: '│     └─ ', name: 'use-pnpm.md', note: d.memoryFile, tone: 'memory' },
    {
      prefix: '├─ ',
      name: '-Users-you-code-app-worktrees-fix/',
      note: d.worktree,
      tone: 'folder',
      badge: t.ui.worktree,
    },
    {
      prefix: '└─ ',
      name: '-private-tmp-claude-xyz/',
      note: d.temporary,
      tone: 'folder',
      badge: t.projects.temporary,
    },
  ]

  return (
    <div>
      <p className="mb-2 text-[11px] tracking-wide text-faint uppercase">{d.eyebrow}</p>
      {/* The tree is drawn with `whitespace-pre`, which cannot wrap, so it scrolls on its own
          rather than prising the page open on a narrow screen. */}
      <ol className="-mx-1 space-y-[3px] overflow-x-auto px-1">
        {rows.map((row, index) => (
          <li
            key={index}
            className="animate-rise grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-baseline"
            style={{ animationDelay: `${100 + index * 60}ms` }}
          >
            <span className="flex min-w-0 items-baseline gap-2 font-mono text-[11.5px] whitespace-pre">
              <span>
                <span className="text-faint">{row.prefix}</span>
                <span className={TONE[row.tone]}>{row.name}</span>
              </span>
              {row.badge && <Badge>{row.badge}</Badge>}
            </span>
            {row.note && (
              <span className="pl-4 text-[11.5px] leading-snug text-muted sm:pl-0">{row.note}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
