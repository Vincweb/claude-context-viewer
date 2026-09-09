import type { LayerGroup } from '../shared/types'

/**
 * The five groups, in the order they are drawn everywhere — the diagrams, the stacked bar, the
 * session list. The colours are categorical slots assigned in this fixed order and never cycled:
 * the ordering is what keeps neighbouring pairs apart for colour-vision deficiencies, so a group
 * keeps its hue whatever else is on screen. Their names live in the dictionaries (`t.groups`).
 */
export const GROUPS: { key: LayerGroup; color: string }[] = [
  { key: 'system', color: 'var(--color-series-system)' },
  { key: 'instructions', color: 'var(--color-series-instructions)' },
  { key: 'capabilities', color: 'var(--color-series-capabilities)' },
  { key: 'session', color: 'var(--color-series-session)' },
  { key: 'runtime', color: 'var(--color-series-runtime)' },
]
