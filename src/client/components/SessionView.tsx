import type { Layer } from '../../shared/types'
import { projectPath } from '../../shared/routes'
import { bytes, tokens, truncate, useWhen } from '../format'
import { GROUPS } from '../groups'
import { useT } from '../i18n'
import { useSession } from '../queries'
import { Disclosure } from './Disclosure'
import { StackedBar } from './StackedBar'
import {
  BackLink,
  Badge,
  Eyebrow,
  Failed,
  Link,
  Loading,
  Mono,
  Muted,
  Panel,
  Rise,
  Stat,
} from './ui'

const LayerRow = ({
  layer,
  widest,
  color,
  index,
}: {
  layer: Layer
  widest: number
  color: string
  index: number
}) => {
  const t = useT()
  return (
    <Disclosure
      className="border-b border-line last:border-0"
      summary={() => (
        <span className="flex min-w-0 items-center gap-3">
          <span className="min-w-0 flex-1">
            <span className="font-medium">{t.session.layers[layer.type] ?? layer.label}</span>{' '}
            <Mono>
              <Muted>{layer.type}</Muted>
            </Mono>
            {layer.occurrences > 1 && (
              <>
                {' '}
                <Badge>×{layer.occurrences}</Badge>
              </>
            )}
          </span>
          <span className="hidden h-2 w-40 shrink-0 overflow-hidden rounded-full bg-code-bg sm:block">
            <span
              className="animate-grow-x origin-left block h-full rounded-full"
              style={{
                width: `${Math.max(2, (layer.chars / widest) * 100)}%`,
                background: color,
                animationDelay: `${200 + Math.min(index, 10) * 40}ms`,
              }}
            />
          </span>
          <span className="w-16 shrink-0 text-right tabular-nums">≈{tokens(layer.tokens)}</span>
        </span>
      )}
    >
      {() => (
        <div className="bg-code-bg">
          {layer.blocks.map((block, index) => (
            <Disclosure
              key={index}
              className="border-b border-line last:border-0"
              summary={() => (
                <span className="flex min-w-0 items-baseline gap-3">
                  <span className="min-w-0 flex-1 truncate">
                    <Mono>{block.title}</Mono>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    <Muted>{block.chars}</Muted>
                  </span>
                </span>
              )}
            >
              {() => (
                <pre className="max-h-[32rem] overflow-auto bg-panel px-4 py-3 font-mono text-[12px] whitespace-pre-wrap">
                  {block.text}
                </pre>
              )}
            </Disclosure>
          ))}
        </div>
      )}
    </Disclosure>
  )
}

export const SessionView = ({ home, slug, id }: { home: string; slug: string; id: string }) => {
  const t = useT()
  const when = useWhen()
  const { data, error, isPending } = useSession(home, slug, id)

  if (isPending) return <Loading what={t.session.loading} />
  if (error) return <Failed error={error} />

  const widest = Math.max(...data.layers.map((layer) => layer.chars), 1)
  // The prompt stack and what the work itself dragged in are two different claims, and lumping
  // them together would let a session that read a lot of files look like a heavy prompt. No timing
  // is implied either way: a nested CLAUDE.md is part of the stack but arrives mid-session.
  const startup = data.layers
    .filter((layer) => layer.group !== 'runtime')
    .reduce((sum, layer) => sum + layer.tokens, 0)

  return (
    <>
      <Rise>
        <section className="mb-5 flex items-start gap-3">
          <span className="mt-1">
            <BackLink to={projectPath(home, slug)} label={t.ui.backToProject} />
          </span>
          <div className="min-w-0">
            <h1 className="font-serif text-[24px] leading-snug tracking-tight [overflow-wrap:anywhere]">
              {data.session.title ?? truncate(data.session.firstPrompt ?? id, 110)}
            </h1>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <Mono className="[overflow-wrap:anywhere]">
                <Muted>{data.cwd ?? slug}</Muted>
              </Mono>
              {data.isWorktree && <Badge>{t.ui.worktree}</Badge>}
              <Muted>{data.session.gitBranch ?? '—'}</Muted>
              <Muted>{when(data.session.lastActive)}</Muted>
              <Muted>{bytes(data.session.bytes)}</Muted>
            </p>
          </div>
        </section>
      </Rise>

      <Rise index={1}>
        <Panel className="mb-7 p-5">
          <div className="mb-5 flex flex-wrap gap-x-10 gap-y-4">
            <Stat value={`≈${tokens(startup)}`} label={t.session.statStack} />
            <Stat value={`≈${tokens(data.tokens - startup)}`} label={t.session.statRuntime} />
            <Stat value={data.layers.length} label={t.session.statLayers} />
            <Stat
              value={`${data.messages.user} / ${data.messages.assistant}`}
              label={t.session.statMessages}
            />
          </div>

          <StackedBar layers={data.layers} total={data.tokens} />

          <p className="mt-5 border-t border-line pt-3 text-muted">
            {t.session.lowerBound}
            {data.memoryRoot && (
              <>
                {' '}
                {t.session.memoryFrom}
                <Mono className="[overflow-wrap:anywhere]">{data.memoryRoot}</Mono>
                {data.isWorktree && t.session.worktreeShared}
              </>
            )}
          </p>
        </Panel>
      </Rise>

      <div className="space-y-6">
        {GROUPS.map((group, groupIndex) => {
          const layers = data.layers.filter((layer) => layer.group === group.key)
          if (layers.length === 0) return null
          const total = layers.reduce((sum, layer) => sum + layer.tokens, 0)
          return (
            <Rise key={group.key} index={2 + groupIndex}>
              <section>
                <div className="mb-2 flex flex-wrap items-baseline gap-x-3 px-1">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: group.color }}
                    aria-hidden
                  />
                  <h2 className="font-semibold">{t.groups[group.key].title}</h2>
                  <span className="tabular-nums">
                    <Muted>≈{tokens(total)}</Muted>
                  </span>
                  <span className="min-w-0 flex-1">
                    <Muted>{t.groups[group.key].hint}</Muted>
                  </span>
                </div>
                <Panel className="overflow-hidden">
                  {layers.map((layer, index) => (
                    <LayerRow
                      key={layer.type}
                      layer={layer}
                      widest={widest}
                      color={group.color}
                      index={index}
                    />
                  ))}
                </Panel>
              </section>
            </Rise>
          )
        })}
      </div>

      <p className="mt-7">
        <Eyebrow>{t.session.sessionId(id)}</Eyebrow>
        <Link to={projectPath(home, slug)}>{t.session.allSessions}</Link>
      </p>
    </>
  )
}
