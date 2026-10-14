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

  // Not record types of their own: the `tools` a `prompt_snapshot` carries, split in two.
  tool_schemas: { label: 'Tool schemas', group: 'capabilities' },
  mcp_tool_schemas: { label: 'MCP tool schemas', group: 'capabilities' },
  deferred_tools_delta: { label: 'Deferred tool names', group: 'capabilities' },
  deferred_tools_record: { label: 'Tools loaded on demand', group: 'capabilities' },
  skill_listing: { label: 'Skills', group: 'capabilities' },
  mcp_instructions_delta: { label: 'MCP server instructions', group: 'capabilities' },
  agent_listing_delta: { label: 'Sub-agents', group: 'capabilities' },
  command_permissions: { label: 'Command permissions', group: 'capabilities' },
  advisor_tool: { label: 'Advisor tool', group: 'capabilities' },

  session_context: { label: 'Session context', group: 'session' },
  environment: { label: 'Environment', group: 'session' },
  model: { label: 'Model', group: 'session' },
  output_style: { label: 'Output style reminder', group: 'session' },
  auto_mode: { label: 'Auto mode', group: 'session' },
  language: { label: 'Language', group: 'session' },
  date: { label: 'Date', group: 'session' },
  total_tokens_reminder: { label: 'Token budget reminder', group: 'session' },
  budget_usd: { label: 'Spending budget', group: 'session' },
  silent_turn_reminder: { label: 'Silent-turn reminder', group: 'session' },
  batching_reminder_sent: { label: 'Batching reminder', group: 'session' },
  remote_session_change: { label: 'Commit & PR attribution', group: 'session' },
  credential_org: { label: 'Organisation', group: 'session' },
  thinking_stripped: { label: 'Thinking stripped', group: 'session' },

  file: { label: 'Files read', group: 'runtime' },
  edited_text_file: { label: 'Files edited', group: 'runtime' },
  directory: { label: 'Directory listings', group: 'runtime' },
  read_truncation_notice: { label: 'Truncated reads', group: 'runtime' },
  invoked_skills: { label: 'Invoked skills', group: 'runtime' },
  todo_reminder: { label: 'Todo reminder', group: 'runtime' },
  task_reminder: { label: 'Task reminder', group: 'runtime' },
  queued_command: { label: 'Queued prompts', group: 'runtime' },
  compact_file_reference: { label: 'Compacted tool results', group: 'runtime' },
  plan_mode: { label: 'Plan mode', group: 'runtime' },
  plan_mode_exit: { label: 'Plan mode exit', group: 'runtime' },
  plan_file_reference: { label: 'Plan file', group: 'runtime' },
  // Not an attachment: the summary a compaction leaves in place of the conversation.
  compact_summary: { label: 'Compaction summary', group: 'runtime' },
}

/**
 * Recorded, but not part of the prompt. A hook's `stdout` is the raw JSON wrapper around the
 * `additionalContext` that `hook_additional_context` already carries — counting both would double
 * every hook, and stdout itself goes to the terminal rather than to the model. A hook that failed
 * or timed out is reported to the terminal the same way: across thousands of such records, Claude
 * never once answers one. A dropped thinking block is the client's own bookkeeping — hashes and
 * request ids, with nothing in it addressed to the model.
 */
const NOT_INJECTED = new Set([
  'hook_success',
  'hook_non_blocking_error',
  'hook_cancelled',
  'thinking_drop',
])

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
  'read_truncation_notice',
  'invoked_skills',
  'compact_file_reference',
  'plan_file_reference',
  'queued_command',
  'compact_summary',
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asString = (value: unknown) => (typeof value === 'string' ? value : null)

const asStrings = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : null

const asRecords = (value: unknown) => (Array.isArray(value) ? value.filter(isRecord) : null)

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
 * One tool as the API receives it: name, description and input schema in one JSON object. Counted
 * at its compact size, which is what is sent; shown as the description followed by the schema
 * spelled out, which is what a person can read.
 */
const toolBlock = (definition: Record<string, unknown>): LayerBlock => {
  const name = asString(definition.name) ?? 'tool'
  const description = asString(definition.description) ?? ''
  const schema = definition.input_schema
  return {
    title: name,
    chars: JSON.stringify(definition).length,
    text:
      schema === undefined ? description : `${description}\n\n${JSON.stringify(schema, null, 2)}`,
    key: name,
  }
}

/**
 * The snapshot's `tools` entries wrap the definition: `schema` is the whole object sent, its own
 * name and description included, so counting the wrapper as well would count every description
 * twice. An entry without one is rebuilt from what it does carry.
 */
const definitionOf = (tool: Record<string, unknown>) =>
  isRecord(tool.schema) ? tool.schema : { name: tool.name, description: tool.description }

/** What one record does to one layer. */
type Update = {
  /** The layer it lands in — usually the record's own type, not always. */
  type: string
  blocks: LayerBlock[]
  /** A full listing, so the layer starts over; otherwise the blocks merge in by key. */
  reset: boolean
  /** Keys a delta takes back out: a tool, an agent or a server that went away. */
  removed?: string[]
  /** A stand-in until a complete record arrives, never a replacement for one. */
  partial?: boolean
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
    // The line that opens the system prompt is kept apart from the array that follows it.
    const prefix = asString(attachment.cliPrefix)
    if (parts) {
      return [
        ...(prefix ? [block(titleOf(prefix, 'prefix'), prefix, 'cliPrefix')] : []),
        ...parts.map((part, index) => block(titleOf(part, `block ${index + 1}`), part, `${index}`)),
      ]
    }
    // The tools have layers of their own; left in here they would be counted twice.
    return [block(type, JSON.stringify({ ...attachment, tools: undefined }, null, 2))]
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

  // A read cut short, and the banner telling Claude where the rest is.
  if (type === 'read_truncation_notice') {
    const banner = asString(attachment.banner)
    if (banner !== null) {
      return [block(titleOf(banner, 'read'), banner, asString(attachment.toolUseID) ?? banner)]
    }
  }

  // After a compaction, the skills invoked before it are injected again in full.
  if (type === 'invoked_skills') {
    const skills = asRecords(attachment.skills)
    if (skills) {
      return skills.map((skill, index) => {
        const name = asString(skill.name) ?? `skill ${index + 1}`
        return block(name, asString(skill.content) ?? '', asString(skill.path) ?? name)
      })
    }
  }

  if (type === 'compact_file_reference') {
    const full = asString(attachment.filename)
    const where = asString(attachment.displayPath) ?? full ?? 'tool result'
    return [block(where, full ?? '', full ?? where)]
  }

  // Every compaction writes a summary of its own; they share their opening line.
  if (type === 'compact_summary') {
    const text = asString(attachment.text) ?? ''
    const when = asString(attachment.timestamp) ?? 'summary'
    return [block(when, text, asString(attachment.uuid) ?? when)]
  }

  if (type === 'queued_command') {
    const when = asString(attachment.timestamp) ?? 'queued'
    return [block(when, asString(attachment.prompt) ?? '')]
  }

  if (type === 'plan_file_reference') {
    const where = asString(attachment.planFilePath) ?? 'plan'
    return [block(where, asString(attachment.planContent) ?? '', where)]
  }

  // `changed` marks the day rolling over mid-session.
  if (type === 'date') {
    const day = asString(attachment.date)
    if (day !== null) return [block(attachment.changed === true ? `${day} · changed` : day, day)]
  }

  // The lines Claude is asked to end commits and pull requests with.
  if (type === 'remote_session_change') {
    const lines = [asString(attachment.commit), asString(attachment.pr)].filter((one) => !!one)
    if (lines.length > 0) return [block('attribution', lines.join('\n'))]
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
 * What one record changes. Most replace their layer or add to it; the listings of tools, skills,
 * agents and MCP servers are deltas instead — names added, names taken away — and only their sum
 * is what Claude was offered.
 */
const updatesFor = (type: string, attachment: Record<string, unknown>): Update[] => {
  if (type === 'prompt_snapshot') {
    // Snapshots come in pairs: one without the tools, then one with them. Only the second is
    // complete, whichever order a session happens to write them in.
    const tools = asRecords(attachment.tools)
    const updates: Update[] = [
      { type, blocks: blocksFor(type, attachment), reset: true, partial: tools === null },
    ]
    if (tools) {
      const isMcp = (tool: Record<string, unknown>) => asString(tool.server) !== null
      const blocksOf = (some: Record<string, unknown>[]) => some.map(definitionOf).map(toolBlock)
      updates.push(
        { type: 'tool_schemas', blocks: blocksOf(tools.filter((one) => !isMcp(one))), reset: true },
        { type: 'mcp_tool_schemas', blocks: blocksOf(tools.filter(isMcp)), reset: true },
      )
    }
    return updates
  }

  if (type === 'deferred_tools_delta') {
    const names = [
      ...(asStrings(attachment.addedNames) ?? []),
      ...(asStrings(attachment.readdedNames) ?? []),
    ]
    const updates: Update[] = [
      {
        type,
        blocks: names.map((name) => block(name, name)),
        reset: false,
        removed: asStrings(attachment.removedNames) ?? [],
      },
    ]
    // A deferred tool can be surfaced with its whole definition rather than only its name.
    const surfaced = (asRecords(attachment.surfacedDefinitions) ?? [])
      .map((one) => one.definition)
      .filter(isRecord)
    if (surfaced.length > 0) {
      updates.push({ type: 'deferred_tools_record', blocks: surfaced.map(toolBlock), reset: false })
    }
    return updates
  }

  // The schemas of deferred tools Claude has loaded so far. A record with no entries is only
  // bookkeeping about tool inputs, and adds nothing to the prompt.
  if (type === 'deferred_tools_record' && Array.isArray(attachment.entries)) {
    const entries = asRecords(attachment.entries) ?? []
    return entries.length > 0 ? [{ type, blocks: entries.map(toolBlock), reset: false }] : []
  }

  if (type === 'agent_listing_delta') {
    const keys = asStrings(attachment.addedTypes) ?? asStrings(attachment.addedNames) ?? []
    const lines = asStrings(attachment.addedLines) ?? keys
    return [
      {
        type,
        blocks: lines.map((line, index) => block(keys[index] ?? titleOf(line, 'agent'), line)),
        reset: attachment.isInitial === true,
        removed: asStrings(attachment.removedTypes) ?? asStrings(attachment.removedNames) ?? [],
      },
    ]
  }

  if (type === 'mcp_instructions_delta') {
    const keys = asStrings(attachment.addedNames) ?? []
    const texts = asStrings(attachment.addedBlocks) ?? []
    return [
      {
        type,
        blocks: texts.map((text, index) => block(keys[index] ?? titleOf(text, 'server'), text)),
        reset: false,
        removed: asStrings(attachment.removedNames) ?? [],
      },
    ]
  }

  if (type === 'skill_listing') {
    // The first listing is whole; later ones add the skills that turned up since.
    const reset = attachment.isInitial !== false
    const content = asString(attachment.content)
    const names = asStrings(attachment.names)
    if (content !== null && names) {
      // One `- name: description` entry per skill, each keeping the newline that ends it.
      const entries = content.split(/(?<=\n)(?=- )/)
      if (entries.length === names.length) {
        const blocks = entries.map((one, index) => block(names[index] ?? `skill ${index + 1}`, one))
        return [{ type, blocks, reset }]
      }
    }
    const one = asBlock(content, 'skills')
    return one ? [{ type, blocks: [one], reset }] : []
  }

  return [{ type, blocks: blocksFor(type, attachment), reset: !ACCUMULATES.has(type) }]
}

/** The MCP server a tool belongs to, read from its `mcp__<server>__<tool>` name. */
const serverOf = (name: string) => /^mcp__(.+?)__/.exec(name)?.[1] ?? null

/**
 * How a layer is shown, once every record is in. Hundreds of deferred tool names are one line each
 * in the prompt, and far easier to weigh as one block per server.
 */
const present = (type: string, blocks: LayerBlock[]) => {
  if (type !== 'deferred_tools_delta') return blocks
  const byServer = new Map<string, string[]>()
  for (const { key } of blocks) {
    const server = serverOf(key) ?? 'built-in'
    byServer.set(server, [...(byServer.get(server) ?? []), key])
  }
  return [...byServer].map(([server, names]) =>
    block(`${server} · ${names.length}`, names.join('\n'), server),
  )
}

/**
 * Folds the attachment records of a session into one row per layer.
 *
 * Some layers are injected once, some on every turn — the token reminder, the output-style nudge —
 * and some carry something new each time: a different nested CLAUDE.md, another file read. The
 * first two keep their latest content; the third accumulates, so five nested CLAUDE.md files show
 * as five blocks rather than only the last one. The listings are deltas, folded into the set they
 * add up to. Sizes are characters over four: close enough to rank layers against each other, which
 * is what the page is for.
 */
export const foldLayers = (attachments: { type: string; value: Record<string, unknown> }[]) => {
  const byType = new Map<string, { blocks: LayerBlock[]; occurrences: number; complete: boolean }>()

  for (const { type, value } of attachments) {
    if (NOT_INJECTED.has(type)) continue
    for (const update of updatesFor(type, value)) {
      const layer = byType.get(update.type) ?? { blocks: [], occurrences: 0, complete: false }
      byType.set(update.type, layer)
      layer.occurrences += 1
      if (update.partial && layer.complete) continue
      if (!update.partial) layer.complete = true

      if (update.reset) {
        layer.blocks = update.blocks
        continue
      }
      // Keyed, and a later injection replaces the earlier one: a file read, edited and read again
      // is one block holding what it last looked like, not three claiming to be different files.
      const gone = new Set(update.removed)
      const byKey = new Map(
        layer.blocks.filter((one) => !gone.has(one.key)).map((one) => [one.key, one]),
      )
      for (const one of update.blocks) byKey.set(one.key, one)
      layer.blocks = [...byKey.values()]
    }
  }

  const layers: Layer[] = []
  for (const [type, { blocks: kept, occurrences }] of byType) {
    // A listing whose every entry was taken back has nothing left to show.
    if (kept.length === 0) continue
    const blocks = present(type, kept)
    const chars = blocks.reduce((total, one) => total + one.chars, 0)
    const known = KNOWN[type]
    layers.push({
      type,
      label: known?.label ?? type,
      group: known?.group ?? 'session',
      chars,
      tokens: Math.round(chars / 4),
      occurrences,
      blocks,
    })
  }

  return layers.sort((a, b) => {
    const groups = GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group)
    return groups !== 0 ? groups : b.chars - a.chars
  })
}
