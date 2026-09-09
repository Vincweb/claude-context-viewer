import type { ExtraKind } from '../../shared/types'
import { bytes, tokens } from '../format'
import { useT } from '../i18n'
import { useExtras } from '../queries'
import { Badge, Eyebrow, Failed, Loading, Mono, Muted, Panel } from './ui'

/** Heaviest and most surprising first; the desktop app's own bookkeeping last. */
const ORDER: ExtraKind[] = [
  'subagent',
  'tool-result',
  'workflow',
  'artifact',
  'hook',
  'index',
  'released',
  'other',
]

/**
 * What else is in the folder. The sessions tab lists the transcripts and the memory tab the
 * memories; this is everything the two of them skip, which on a folder that has run sub-agents is
 * the larger half of it.
 */
export const ExtrasPanel = ({
  home,
  slug,
  active,
}: {
  home: string
  slug: string
  active: boolean
}) => {
  const t = useT()
  const { data, error, isPending } = useExtras(home, slug, active)

  if (isPending) return <Loading what={t.extras.loading} />
  if (error) return <Failed error={error} />

  const groups = ORDER.map((kind) => ({
    kind,
    files: data.files.filter((file) => file.kind === kind),
  })).filter((group) => group.files.length > 0)

  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <Eyebrow>{t.extras.how}</Eyebrow>
        <p className="max-w-3xl text-muted">{t.extras.howText}</p>
        <p className="mt-2 max-w-3xl">
          <Muted>{t.extras.subagentNote}</Muted>
        </p>
        {data.files.length > 0 && (
          <p className="mt-3 font-medium">{t.extras.total(data.files.length, bytes(data.bytes))}</p>
        )}
      </Panel>

      {groups.length === 0 && (
        <Panel className="p-4">
          <p>{t.extras.empty}</p>
          <p className="mt-1 text-muted">{t.extras.emptyHint}</p>
        </Panel>
      )}

      {groups.map((group) => {
        const total = group.files.reduce((sum, file) => sum + file.bytes, 0)
        return (
          <section key={group.kind}>
            <div className="mb-2 flex flex-wrap items-baseline gap-x-3 px-1">
              <h2 className="font-medium">{t.extras.kinds[group.kind]}</h2>
              <span className="tabular-nums">
                <Muted>
                  {group.files.length} · {bytes(total)}
                </Muted>
              </span>
              <span className="min-w-0 flex-1">
                <Muted>{t.extras.hints[group.kind]}</Muted>
              </span>
            </div>
            <Panel className="overflow-hidden">
              {group.files.map((file) => (
                <div
                  key={file.path}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line px-4 py-2.5 last:border-0"
                >
                  <span className="min-w-0 flex-1">
                    {file.label ? (
                      <>
                        <span className="flex flex-wrap items-baseline gap-2">
                          <Badge>{file.label}</Badge>
                          <span className="min-w-0 flex-1">{file.detail ?? file.path}</span>
                        </span>
                        <span className="block truncate">
                          <Mono>
                            <Muted>{file.path}</Muted>
                          </Mono>
                        </span>
                      </>
                    ) : (
                      <Mono className="block truncate">{file.path}</Mono>
                    )}
                  </span>
                  <span className="w-20 shrink-0 text-right tabular-nums">
                    <Muted>≈{tokens(Math.round(file.bytes / 4))}</Muted>
                  </span>
                  <span className="w-20 shrink-0 text-right tabular-nums whitespace-nowrap">
                    <Muted>{bytes(file.bytes)}</Muted>
                  </span>
                </div>
              ))}
            </Panel>
          </section>
        )
      })}

      {data.truncated && (
        <p>
          <Muted>{t.extras.truncated}</Muted>
        </p>
      )}
    </div>
  )
}
