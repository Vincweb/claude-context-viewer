import type { Layer } from '../../shared/types'
import { tokens } from '../format'
import { GROUPS } from '../groups'
import { useT } from '../i18n'

/**
 * One session's context as a single stacked bar: the five groups, to scale, in the fixed order.
 * Segments carry a 2px gap so neighbours never blur into one mark, and every one is named in the
 * legend beneath — the colours are identity, the labels are what you actually read.
 */
export const StackedBar = ({ layers, total }: { layers: Layer[]; total: number }) => {
  const t = useT()
  const parts = GROUPS.map((group) => ({
    ...group,
    ...t.groups[group.key],
    tokens: layers
      .filter((layer) => layer.group === group.key)
      .reduce((sum, layer) => sum + layer.tokens, 0),
  })).filter((part) => part.tokens > 0)

  return (
    <div>
      <div className="flex h-7 gap-[2px]" role="presentation">
        {parts.map((part, index) => (
          <div
            key={part.key}
            className="animate-grow-x origin-left h-full rounded-[4px]"
            style={{
              background: part.color,
              // A share of the whole, with a floor: a layer worth a few hundred tokens still has
              // to be visible as a mark rather than vanish into a gap.
              flexGrow: Math.max(part.tokens / total, 0.012),
              animationDelay: `${index * 60}ms`,
            }}
            title={`${part.title} — ≈${tokens(part.tokens)} tokens`}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-5">
        {parts.map((part, index) => (
          <li
            key={part.key}
            className="animate-rise flex items-baseline gap-2"
            style={{ animationDelay: `${150 + index * 50}ms` }}
          >
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{ background: part.color }}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block truncate font-medium">{part.short}</span>
              <span className="block tabular-nums text-muted">
                ≈{tokens(part.tokens)} · {Math.round((part.tokens / total) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
