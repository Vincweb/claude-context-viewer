import type { InstructionSource } from '../../shared/types'
import { serverText, useT } from '../i18n'
import { useInstructions } from '../queries'
import { Badge, Eyebrow, Failed, Loading, Mono, Muted, Panel } from './ui'
import { Disclosure } from './Disclosure'
import { FileView } from './FileView'

const STATUS_TONE: Record<InstructionSource['status'], 'plain' | 'warn'> = {
  start: 'plain',
  'on-demand': 'plain',
  empty: 'warn',
  absent: 'warn',
}

const Summary = ({ source, recorded }: { source: InstructionSource; recorded: number }) => {
  const t = useT()
  return (
    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="min-w-0 flex-1">
        <Mono className={source.status === 'absent' ? 'text-faint line-through' : undefined}>
          {serverText(t.instructions.labels, source.label)}
        </Mono>
        {source.note && (
          <span className="block">
            <Muted>{serverText(t.instructions.notes, source.note)}</Muted>
          </span>
        )}
      </span>
      <Badge>{t.instructions.kinds[source.kind]}</Badge>
      <Badge tone={STATUS_TONE[source.status]}>{t.instructions.statuses[source.status]}</Badge>
      <span className="w-24 text-right tabular-nums">
        {source.chars > 0 ? (
          <Muted>
            ≈{Math.round(source.chars / 4)} {t.instructions.tok}
          </Muted>
        ) : (
          <Muted>—</Muted>
        )}
      </span>
      <span className="w-28 text-right tabular-nums">
        {source.status === 'absent' || source.status === 'empty' ? (
          <Muted>—</Muted>
        ) : source.seenInSessions > 0 ? (
          <Muted>{t.instructions.seenIn(source.seenInSessions, recorded)}</Muted>
        ) : (
          <Muted>{t.instructions.neverSeen}</Muted>
        )}
      </span>
    </span>
  )
}

/**
 * One file. A row with something on disk opens onto the text itself — the point of the page is
 * to see what would be injected, not only that it would be. An absent or empty file has nothing
 * to open and stays a plain row.
 */
const Row = ({ source, recorded }: { source: InstructionSource; recorded: number }) => {
  if (source.content === null)
    return (
      <div className="border-b border-line py-2.5 pr-4 pl-8 last:border-0">
        <Summary source={source} recorded={recorded} />
      </div>
    )
  return (
    <Disclosure
      className="border-b border-line last:border-0"
      summary={() => <Summary source={source} recorded={recorded} />}
    >
      {() => <FileView text={source.content ?? ''} path={source.path} />}
    </Disclosure>
  )
}

/**
 * What *can* put instructions into a session here, next to whether it ever did. The transcript
 * only records what was injected, so a CLAUDE.md that is never read looks identical to one that
 * does not exist — until you put the two side by side.
 */
export const InstructionsPanel = ({
  home,
  slug,
  active,
}: {
  home: string
  slug: string
  active: boolean
}) => {
  const t = useT()
  const { data, error, isPending } = useInstructions(home, slug, active)

  if (isPending) return <Loading what={t.instructions.loading} />
  if (error) return <Failed error={error} />

  const always = data.sources.filter((source) => source.status !== 'on-demand')
  const nested = data.sources.filter((source) => source.status === 'on-demand')
  const nestedLoaded = nested.filter((source) => source.seenInSessions > 0).length

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <Eyebrow>{t.instructions.howToRead}</Eyebrow>
        <p className="max-w-3xl text-muted">{t.instructions.howToReadText}</p>
        <p className="mt-2 max-w-3xl">
          <Muted>{t.instructions.recorded(data.recorded, data.sessions)}</Muted>
        </p>
        {!data.cwdExists && data.cwd && (
          <p className="mt-2">
            <Muted>{t.instructions.cwdGone}</Muted>
          </p>
        )}
      </Panel>

      <section>
        <Eyebrow>{t.instructions.loadedEvery}</Eyebrow>
        <Panel className="overflow-hidden">
          {always.map((source) => (
            <Row key={source.path} source={source} recorded={data.recorded} />
          ))}
        </Panel>
      </section>

      {nested.length > 0 && (
        <section>
          <Eyebrow>{t.instructions.nestedEyebrow(nested.length, nestedLoaded)}</Eyebrow>
          <Panel className="overflow-hidden">
            <Disclosure
              summary={() => (
                <span className="flex min-w-0 items-baseline gap-3">
                  <span className="min-w-0 flex-1">{t.instructions.nestedSummary}</span>
                  <span className="shrink-0 tabular-nums">
                    <Muted>
                      {t.instructions.nestedTotal(
                        Math.round(nested.reduce((total, source) => total + source.chars, 0) / 4),
                      )}
                    </Muted>
                  </span>
                </span>
              )}
            >
              {() =>
                nested.map((source) => (
                  <Row key={source.path} source={source} recorded={data.recorded} />
                ))
              }
            </Disclosure>
          </Panel>
          {data.truncated && (
            <p className="mt-2">
              <Muted>{t.instructions.truncated}</Muted>
            </p>
          )}
        </section>
      )}
    </div>
  )
}
