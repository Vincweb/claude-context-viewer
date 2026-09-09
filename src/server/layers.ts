import type { Layer, LayerBlock, LayerGroup } from '../shared/types'

/**
 * Every layer Claude Code is known to inject, in the order the page shows them: what Claude is
 * told it is, then what your files tell it, then what it can reach for, then this session's
 * settings, then everything pulled in while the work happened.
 *
 * A type missing from here still renders — it lands in `session` as its own JSON — so a new layer
 * in a future release shows up as itself rather than disappearing.
 */
const KNOWN: Record<string, { label: string; group: LayerGroup }> = {
  prompt_snapshot: { label: 'System prompt', group: 'system' },
  output_style_instructions: { label: 'Output style', group: 'system' },

  instructions: { label: 'CLAUDE.md & memory index', group: 'instructions' },
  nested_memory: { label: 'Nested CLAUDE.md', group: 'instructions' },
  hook_additional_context: { label: 'Hook-injected context', group: 'instructions' },

  deferred_tools_delta: { label: 'Deferred tools (MCP)', group: 'capabilities' },
  deferred_tools_record: { label: 'Tools loaded on demand', group: 'capabilities' },
  skill_listing: { label: 'Skills', group: 'capabilities' },
  mcp_instructions_delta: { label: 'MCP server instructions', group: 'capabilities' },
  agent_listing_delta: { label: 'Sub-agents', group: 'capabilities' },
  command_permissions: { label: 'Command permissions', group: 'capabilities' },

  session_context: { label: 'Session context', group: 'session' },
  environment: { label: 'Environment', group: 'session' },
  model: { label: 'Model', group: 'session' },
  output_style: { label: 'Output style reminder', group: 'session' },
  auto_mode: { label: 'Auto mode', group: 'session' },
  language: { label: 'Language', group: 'session' },
  date: { label: 'Date', group: 'session' },
  date_change: { label: 'Date rollover', group: 'session' },
  total_tokens_reminder: { label: 'Token budget reminder', group: 'session' },
  thinking_stripped: { label: 'Thinking stripped', group: 'session' },

  file: { label: 'Files read', group: 'runtime' },
  edited_text_file: { label: 'Files edited', group: 'runtime' },
  directory: { label: 'Directory listings', group: 'runtime' },
  todo_reminder: { label: 'Todo reminder', group: 'runtime' },
  task_reminder: { label: 'Task reminder', group: 'runtime' },
  queued_command: { label: 'Queued prompts', group: 'runtime' },
  compact_file_reference: { label: 'Compacted tool results', group: 'runtime' },
  plan_mode: { label: 'Plan mode', group: 'runtime' },
  plan_mode_exit: { label: 'Plan mode exit', group: 'runtime' },
  plan_file_reference: { label: 'Plan file', group: 'runtime' },
}

/**
 * Recorded, but not part of the prompt. A hook's `stdout` is the raw JSON wrapper around the
 * `additionalContext` that `hook_additional_context` already carries — counting both would double
 * every hook, and stdout itself goes to the terminal rather than to the model.
 */
const NOT_INJECTED = new Set(['hook_success'])

export const GROUP_ORDER: LayerGroup[] = [
  'system',
  'instructions',
  'capabilities',
  'session',
  'runtime',
]

/**
 * Types whose every occurrence carries *different* content — a different CLAUDE.md, a different
 * file, another hook firing. Their blocks accumulate instead of the last one winning, deduped by
 * title so a file read twice is listed once.
 */
const ACCUMULATES = new Set([
  // The instruction stack is re-injected during a session, and a later injection need not repeat
  // every file: one carrying only the memory index does not mean the project's CLAUDE.md was
  // never sent. Keyed by path, so the same file seen twice counts once, at its latest size.
  'instructions',
  'nested_memory',
  'hook_additional_context',
  'file',
  'edited_text_file',
  'directory',
  'compact_file_reference',
  'plan_file_reference',
  'queued_command',
  'date_change',
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asString = (value: unknown) => (typeof value === 'string' ? value : null)

const asStrings = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : null

/** A block's heading: the first line that says something, short enough to scan down a column. */
const titleOf = (text: string, fallback: string) => {
  const line = text
    .split('\n')
    .map((one) => one.trim())
    .find((one) => one.length > 0)
  if (!line) return fallback
  return line.length > 88 ? `${line.slice(0, 88)}…` : line
}

const block = (title: string, text: string, key = title): LayerBlock => ({
  title,
  chars: text.length,
  text,
  key,
})

const asBlock = (value: unknown, fallback: string) => {
  const text = asString(value)
  return text === null ? null : block(titleOf(text, fallback), text)
}

/**
 * One layer's content, split the way that layer is actually built. The system prompt arrives as an
 * array of independent chunks and the instructions as a list of files, and both are far more
 * useful kept apart than concatenated: that is how you see which file, or which paragraph, is the
 * heavy one.
 */
const blocksFor = (type: string, attachment: Record<string, unknown>): LayerBlock[] => {
  if (type === 'prompt_snapshot') {
    const parts = asStrings(attachment.systemPrompt)
    if (parts) return parts.map((part, index) => block(titleOf(part, `block ${index + 1}`), part))
  }

  if (type === 'instructions' && Array.isArray(attachment.files)) {
    return attachment.files.filter(isRecord).map((file, index) => {
      const content = asString(file.content) ?? ''
      const where = asString(file.path) ?? `file ${index + 1}`
      return block(`${asString(file.type) ?? 'file'} · ${where}`, content, where)
    })
  }

  // A CLAUDE.md from a subdirectory, pulled in the first time Claude touches a file under it.
  if (type === 'nested_memory' && isRecord(attachment.content)) {
    const full = asString(attachment.path)
    const where = asString(attachment.displayPath) ?? full ?? 'nested CLAUDE.md'
    const kind = asString(attachment.content.type) ?? 'Project'
    return [block(`${kind} · ${where}`, asString(attachment.content.content) ?? '', full ?? where)]
  }

  if (type === 'hook_additional_context') {
    const lines = asStrings(attachment.content)
    if (lines) {
      const name = asString(attachment.hookName) ?? 'hook'
      const text = lines.join('\n')
      // A hook fires on every matching tool call; the same message twice is one block, a
      // different message from the same hook is another.
      return [block(name, text, `${name}\n${text}`)]
    }
  }

  if (type === 'file' && isRecord(attachment.content)) {
    const inner = isRecord(attachment.content.file) ? attachment.content.file : null
    const full = asString(attachment.filename)
    const where = asString(attachment.displayPath) ?? full ?? 'file'
    return [block(where, asString(inner?.content) ?? '', full ?? where)]
  }

  if (type === 'edited_text_file') {
    const where = asString(attachment.filename) ?? 'file'
    return [block(where, asString(attachment.snippet) ?? '')]
  }

  if (type === 'directory') {
    const full = asString(attachment.path)
    const where = asString(attachment.displayPath) ?? full ?? 'directory'
    return [block(where, asString(attachment.content) ?? '', full ?? where)]
  }

  if (type === 'compact_file_reference') {
    const full = asString(attachment.filename)
    const where = asString(attachment.displayPath) ?? full ?? 'tool result'
    return [block(where, full ?? '', full ?? where)]
  }

  if (type === 'queued_command') {
    const when = asString(attachment.timestamp) ?? 'queued'
    return [block(when, asString(attachment.prompt) ?? '')]
  }

  if (type === 'plan_file_reference') {
    const where = asString(attachment.planFilePath) ?? 'plan'
    return [block(where, asString(attachment.planContent) ?? '', where)]
  }

  if (type === 'date_change') {
    const day = asString(attachment.newDate) ?? 'date'
    return [block(day, day, day)]
  }

  if (type === 'mcp_instructions_delta') {
    const added = asStrings(attachment.addedBlocks)
    if (added) return added.map((one, index) => block(titleOf(one, `server ${index + 1}`), one))
  }

  if (type === 'deferred_tools_delta' || type === 'agent_listing_delta') {
    const lines = asStrings(attachment.addedLines) ?? asStrings(attachment.addedNames)
    if (lines) return [block(`${lines.length} entries`, lines.join('\n'))]
  }

  if (type === 'skill_listing') {
    const one = asBlock(attachment.content, 'skills')
    if (one) return [one]
  }

  if (type === 'output_style_instructions' && isRecord(attachment.style)) {
    const prompt = asString(attachment.style.prompt)
    if (prompt !== null) return [block(asString(attachment.style.name) ?? 'style', prompt)]
  }

  if (type === 'output_style') {
    const one = asBlock(attachment.turnReminder, 'reminder')
    if (one) return [one]
  }

  if (type === 'session_context' && isRecord(attachment.context)) {
    return Object.entries(attachment.context).map(([key, value]) =>
      block(key, typeof value === 'string' ? value : JSON.stringify(value, null, 2)),
    )
  }

  const text = asString(attachment.text)
  if (text !== null) return [block(titleOf(text, type), text)]

  // Everything else is small and structured, and reads better as the JSON it is.
  return [block(type, JSON.stringify(attachment, null, 2))]
}

/**
 * Folds the attachment records of a session into one row per layer.
 *
 * Some layers are injected once, some on every turn — the token reminder, the output-style nudge —
 * and some carry something new each time: a different nested CLAUDE.md, another file read. The
 * first two keep their latest content; the third accumulates, so five nested CLAUDE.md files show
 * as five blocks rather than only the last one. Sizes are characters over four: close enough to
 * rank layers against each other, which is what the page is for.
 */
export const foldLayers = (attachments: { type: string; value: Record<string, unknown> }[]) => {
  const byType = new Map<string, Layer>()

  for (const { type, value } of attachments) {
    if (NOT_INJECTED.has(type)) continue
    const known = KNOWN[type]
    const existing = byType.get(type)
    const fresh = blocksFor(type, value)

    let blocks = fresh
    if (existing && ACCUMULATES.has(type)) {
      // Keyed, and a later injection replaces the earlier one: a file read, edited and read again
      // is one block holding what it last looked like, not three claiming to be different files.
      const byKey = new Map(existing.blocks.map((one) => [one.key, one]))
      for (const one of fresh) byKey.set(one.key, one)
      blocks = [...byKey.values()]
    }

    const chars = blocks.reduce((total, one) => total + one.chars, 0)
    byType.set(type, {
      type,
      label: known?.label ?? type,
      group: known?.group ?? 'session',
      chars,
      tokens: Math.round(chars / 4),
      occurrences: (existing?.occurrences ?? 0) + 1,
      blocks,
    })
  }

  return [...byType.values()].sort((a, b) => {
    const groups = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group)
    return groups !== 0 ? groups : b.chars - a.chars
  })
}
