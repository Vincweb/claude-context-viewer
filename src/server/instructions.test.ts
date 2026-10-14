import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readInstructionSources } from './instructions'
import { fixture } from './testing'

const read = (cwd: string) =>
  readInstructionSources({ home: cwd, cwd, memoryIndex: null, seen: new Map() }).sources

const withAgents = fixture({ 'AGENTS.md': '# Agents\n' })
const withBoth = fixture({ 'AGENTS.md': '# Agents\n', 'CLAUDE.md': '# Claude\n' })

test('an AGENTS.md stands in for a missing CLAUDE.md', () => {
  const agents = read(withAgents).find((source) => source.label === 'AGENTS.md')
  assert.equal(agents?.status, 'start')
  assert.equal(agents?.note, 'read in place of the missing CLAUDE.md')
})

test('an AGENTS.md beside a CLAUDE.md is not read, so it is not listed', () => {
  assert.equal(
    read(withBoth).some((source) => source.label === 'AGENTS.md'),
    false,
  )
})
