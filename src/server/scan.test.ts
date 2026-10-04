import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import { test } from 'node:test'
import { readProjectMemory, readSessions, scanProjects } from './scan'
import { fixture, record } from './testing'

const CHECKOUT = '-Users-me-app'
const WORKTREE = '-Users-me-app--claude-worktrees-feature'
const OLD = '00000000-0000-4000-8000-000000000001'
const NEW = '00000000-0000-4000-8000-000000000002'
const TREE = '00000000-0000-4000-8000-000000000003'

/** The `instructions` attachment that names the memory index a session was given. */
const autoMem = (index: string) =>
  record({
    type: 'attachment',
    attachment: { type: 'instructions', files: [{ type: 'AutoMem', path: index, content: '' }] },
  })

const prompt = (text: string, timestamp: string, cwd: string) =>
  record({
    type: 'user',
    cwd,
    gitBranch: 'main',
    version: '2.1.0',
    timestamp,
    message: { role: 'user', content: text },
  })

const home = fixture({
  [`projects/${CHECKOUT}/memory/MEMORY.md`]: '- [One](one.md) — a fact\n',
  [`projects/${CHECKOUT}/memory/one.md`]: '---\nname: one\n---\n',
  [`projects/${CHECKOUT}/${OLD}.jsonl`]: prompt(
    'first',
    '2026-01-01T00:00:00.000Z',
    '/Users/me/app',
  ),
  [`projects/${CHECKOUT}/${NEW}.jsonl`]:
    prompt('hello', '2026-02-01T00:00:00.000Z', '/Users/me/app') +
    record({ type: 'assistant', timestamp: '2026-02-02T00:00:00.000Z' }),
  [`projects/${WORKTREE}/${TREE}.jsonl`]: prompt(
    'in the worktree',
    '2026-03-01T00:00:00.000Z',
    '/Users/me/app/.claude/worktrees/feature',
  ),
})
// The worktree's session names the checkout's memory index, which only exists once the fixture does.
fs.appendFileSync(
  path.join(home, 'projects', WORKTREE, `${TREE}.jsonl`),
  autoMem(path.join(home, 'projects', CHECKOUT, 'memory', 'MEMORY.md')),
)

test('one row per project folder, the most recently active first', () => {
  const [worktree, checkout] = scanProjects(home)
  assert.equal(worktree?.slug, WORKTREE)
  assert.equal(checkout?.slug, CHECKOUT)
  assert.equal(checkout?.label, 'app')
  assert.equal(checkout?.sessions, 2)
  assert.equal(checkout?.memoryFiles, 1)
})

test('last active is the last record written, not the first', () => {
  const checkout = scanProjects(home).find((project) => project.slug === CHECKOUT)
  assert.equal(checkout?.lastActive, '2026-02-02T00:00:00.000Z')
})

test('a worktree is tied to the checkout whose memory its sessions load', () => {
  const worktree = scanProjects(home).find((project) => project.slug === WORKTREE)
  assert.equal(worktree?.isWorktree, true)
  assert.equal(worktree?.parent, CHECKOUT)

  const memory = readProjectMemory(home, WORKTREE)
  assert.equal(memory?.sharedWith, CHECKOUT)
  assert.deepEqual(
    memory?.files.map((file) => file.file),
    ['one.md'],
  )
})

test('sessions are described from their first records, newest first', () => {
  const sessions = readSessions(home, CHECKOUT)
  assert.deepEqual(
    sessions?.map((session) => session.id),
    [NEW, OLD],
  )
  assert.equal(sessions?.[0]?.firstPrompt, 'hello')
  assert.equal(sessions?.[0]?.gitBranch, 'main')
  assert.equal(sessions?.[0]?.cliVersion, '2.1.0')
})

test('an unknown project is null, not an error', () => {
  assert.equal(readSessions(home, 'nope'), null)
  assert.equal(readProjectMemory(home, '../..'), null)
})
