import assert from 'node:assert/strict'
import { test } from 'node:test'
import { foldLayers } from './layers'

const file = (filename: string, content: string) => ({
  type: 'file',
  value: { filename, content: { file: { content } } },
})

test('hook stdout is recorded but never injected, so it is not counted', () => {
  assert.deepEqual(foldLayers([{ type: 'hook_success', value: { stdout: '{}' } }]), [])
})

test('a type this version has never seen still shows, as itself', () => {
  const [layer] = foldLayers([{ type: 'brand_new', value: { text: 'hi' } }])
  assert.equal(layer?.label, 'brand_new')
  assert.equal(layer?.group, 'session')
  assert.equal(layer?.blocks[0]?.text, 'hi')
})

test('files read accumulate, one block per file at its latest content', () => {
  const [layer] = foldLayers([file('/a', 'one'), file('/b', 'two'), file('/a', 'one, edited')])
  assert.equal(layer?.occurrences, 3)
  assert.deepEqual(
    layer?.blocks.map((block) => block.text),
    ['one, edited', 'two'],
  )
})

test('a reminder repeated every turn keeps only its latest text', () => {
  const [layer] = foldLayers([
    { type: 'total_tokens_reminder', value: { text: 'a' } },
    { type: 'total_tokens_reminder', value: { text: 'bbbb' } },
  ])
  assert.equal(layer?.occurrences, 2)
  assert.equal(layer?.chars, 4)
  assert.equal(layer?.tokens, 1)
})

test('layers sort by group, then heaviest first', () => {
  const layers = foldLayers([
    file('/small', 'x'),
    { type: 'date', value: { text: 'today' } },
    { type: 'directory', value: { path: '/big', content: 'x'.repeat(100) } },
    { type: 'prompt_snapshot', value: { systemPrompt: ['You are Claude.'] } },
  ])
  assert.deepEqual(
    layers.map((layer) => layer.type),
    ['prompt_snapshot', 'date', 'directory', 'file'],
  )
})

for (const type of ['hook_non_blocking_error', 'hook_cancelled', 'thinking_drop']) {
  test(`${type} goes to the terminal or the client's books, not to Claude`, () => {
    assert.deepEqual(foldLayers([{ type, value: { stderr: 'boom', blockHashes: ['x'] } }]), [])
  })
}

/** A tool as a snapshot lists it: `schema` is the whole definition sent, name and all. */
const tool = (name: string, description: string, server?: string) => ({
  name,
  description,
  schema: { name, description, input_schema: { type: 'object', properties: {} } },
  ...(server ? { server } : {}),
})

const SNAPSHOT = { systemPrompt: ['You are Claude.', 'Be brief.'] }
const COMPLETE = {
  ...SNAPSHOT,
  cliPrefix: 'You are Claude Code.',
  tools: [tool('Read', 'Reads a file.'), tool('mcp__docs__guide', 'Guides.', 'docs')],
}

test('the tools a snapshot carries are counted, built-in apart from MCP', () => {
  const layers = foldLayers([
    { type: 'prompt_snapshot', value: SNAPSHOT },
    { type: 'prompt_snapshot', value: COMPLETE },
  ])
  const byType = new Map(layers.map((layer) => [layer.type, layer]))

  const builtIn = byType.get('tool_schemas')
  assert.equal(builtIn?.group, 'capabilities')
  assert.deepEqual(
    builtIn?.blocks.map((block) => block.title),
    ['Read'],
  )
  // The definition as sent, compact: the wrapper's own copy of the description is not counted.
  assert.equal(builtIn?.chars, JSON.stringify(COMPLETE.tools[0]?.schema).length)
  assert.match(builtIn?.blocks[0]?.text ?? '', /^Reads a file\.\n\n\{\n {2}"type": "object"/)

  assert.deepEqual(
    byType.get('mcp_tool_schemas')?.blocks.map((block) => block.title),
    ['mcp__docs__guide'],
  )
})

test('the snapshot with tools wins, whichever of the pair comes last', () => {
  for (const order of [
    [SNAPSHOT, COMPLETE],
    [COMPLETE, SNAPSHOT],
  ]) {
    const layers = foldLayers(order.map((value) => ({ type: 'prompt_snapshot', value })))
    const system = layers.find((layer) => layer.type === 'prompt_snapshot')
    assert.equal(system?.occurrences, 2)
    assert.deepEqual(
      system?.blocks.map((block) => block.text),
      ['You are Claude Code.', 'You are Claude.', 'Be brief.'],
    )
    assert.ok(layers.some((layer) => layer.type === 'tool_schemas'))
  }
})

const deferred = (added: string[], extra: Record<string, unknown> = {}) => ({
  type: 'deferred_tools_delta',
  value: { addedNames: added, addedLines: added, removedNames: [], ...extra },
})

test('deferred tool deltas add up, rather than the last one winning', () => {
  // The bulk at startup, then the tools of an MCP server that connected late.
  const [layer] = foldLayers([
    deferred(['WebFetch', 'mcp__a__one', 'mcp__a__two']),
    deferred(['mcp__b__three']),
  ])
  assert.equal(layer?.occurrences, 2)
  // One block per server, each listing its names one per line.
  assert.deepEqual(
    layer?.blocks.map((block) => [block.title, block.text]),
    [
      ['built-in · 1', 'WebFetch'],
      ['a · 2', 'mcp__a__one\nmcp__a__two'],
      ['b · 1', 'mcp__b__three'],
    ],
  )
})

test('a deferred tool removed then re-added is counted once', () => {
  const [layer] = foldLayers([
    deferred(['mcp__a__one', 'mcp__a__two']),
    deferred([], { removedNames: ['mcp__a__one', 'mcp__a__two'] }),
    // Re-added names come without their lines.
    deferred(['mcp__a__one'], { addedLines: [], readdedNames: ['mcp__a__one'] }),
  ])
  assert.deepEqual(
    layer?.blocks.map((block) => block.text),
    ['mcp__a__one'],
  )
})

test('a listing whose every entry was removed is not shown', () => {
  assert.deepEqual(foldLayers([deferred(['X']), deferred([], { removedNames: ['X'] })]), [])
})

test('loaded tool schemas accumulate by name; a record without entries adds nothing', () => {
  const entry = (name: string) => ({ name, description: name, input_schema: {} })
  const record = (entries: unknown[]) => ({
    type: 'deferred_tools_record',
    value: { entries, toolInputCopies: [{ id: 'toolu_1', copy: 'wire' }] },
  })
  assert.deepEqual(foldLayers([record([])]), [])

  const [layer] = foldLayers([
    record([entry('WebFetch')]),
    record([]),
    record([entry('WebFetch'), entry('Monitor')]),
    // A tool surfaced with its definition lands with the ones loaded on demand.
    deferred([], { surfacedNames: ['Cron'], surfacedDefinitions: [{ definition: entry('Cron') }] }),
  ]).filter((one) => one.type === 'deferred_tools_record')
  assert.deepEqual(
    layer?.blocks.map((block) => block.title),
    ['WebFetch', 'Monitor', 'Cron'],
  )
  assert.equal(layer?.blocks[0]?.chars, JSON.stringify(entry('WebFetch')).length)
})

test('skills: the initial listing replaces, a later one adds', () => {
  const listing = (names: string[], isInitial: boolean) => ({
    type: 'skill_listing',
    value: {
      content: names.map((name) => `- ${name}: does ${name}`).join('\n'),
      names,
      isInitial,
    },
  })
  const [added] = foldLayers([listing(['a', 'b'], true), listing(['c'], false)])
  assert.deepEqual(
    added?.blocks.map((block) => block.title),
    ['a', 'b', 'c'],
  )
  // Each entry keeps the newline that ends it, so the sizes add up to the listing's.
  assert.equal(added?.chars, '- a: does a\n- b: does b'.length + '- c: does c'.length)

  const [replaced] = foldLayers([listing(['a', 'b'], true), listing(['c'], true)])
  assert.deepEqual(
    replaced?.blocks.map((block) => block.title),
    ['c'],
  )
})

test('sub-agents and MCP instructions are deltas too', () => {
  const layers = foldLayers([
    {
      type: 'agent_listing_delta',
      value: { addedTypes: ['old'], addedLines: ['- old: gone soon'], isInitial: true },
    },
    {
      type: 'agent_listing_delta',
      value: { addedTypes: ['Explore'], addedLines: ['- Explore: reads'], isInitial: true },
    },
    {
      type: 'mcp_instructions_delta',
      value: { addedNames: ['a', 'b'], addedBlocks: ['## a\nuse a', '## b\nuse b'] },
    },
    { type: 'mcp_instructions_delta', value: { addedNames: [], removedNames: ['a'] } },
  ])
  const byType = new Map(layers.map((layer) => [layer.type, layer]))
  assert.deepEqual(
    byType.get('agent_listing_delta')?.blocks.map((block) => block.text),
    ['- Explore: reads'],
  )
  assert.deepEqual(
    byType.get('mcp_instructions_delta')?.blocks.map((block) => block.title),
    ['b'],
  )
})

test('newer runtime records are read from the fields that carry their text', () => {
  const layers = foldLayers([
    { type: 'read_truncation_notice', value: { banner: '[Truncated: a]', toolUseID: '1' } },
    { type: 'read_truncation_notice', value: { banner: '[Truncated: b]', toolUseID: '2' } },
    {
      type: 'invoked_skills',
      value: { skills: [{ name: 'pr', path: 'projectSettings:pr', content: 'Open a PR.' }] },
    },
    { type: 'date', value: { date: '2026-10-14', changed: true } },
  ])
  const byType = new Map(layers.map((layer) => [layer.type, layer]))
  assert.equal(byType.get('read_truncation_notice')?.group, 'runtime')
  assert.equal(byType.get('read_truncation_notice')?.blocks.length, 2)
  assert.deepEqual(
    byType.get('invoked_skills')?.blocks.map((block) => [block.title, block.text]),
    [['pr', 'Open a PR.']],
  )
  assert.equal(byType.get('date')?.blocks[0]?.title, '2026-10-14 · changed')
})
