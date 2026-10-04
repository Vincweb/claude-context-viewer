import assert from 'node:assert/strict'
import path from 'path'
import { test } from 'node:test'
import { readMemory } from './memory'
import { fixture } from './testing'

const memory = (name: string, type = 'metadata:\n  type: user', body = 'A fact.') =>
  `---\nname: ${name}\ndescription: one fact\n${type}\n---\n\n${body}\n`

/** Every file but `orphan.md` gets an index line, so only the faults under test show up. */
const files: Record<string, string> = {
  'good.md': memory('good'),
  'linker.md': memory('linker', undefined, 'See [[good]], [[good.md]] and [[missing-one]].'),
  'bare.md': 'No frontmatter at all.\n',
  'noname.md': '---\ndescription: one fact\nmetadata:\n  type: user\n---\n',
  'sentence.md': memory('A sentence, not a slug'),
  'drift.md': memory('some-other-name'),
  'nodesc.md': '---\nname: nodesc\nmetadata:\n  type: user\n---\n',
  'rootype.md': memory('rootype', 'type: user'),
  'notype.md': memory('notype', ''),
  'weird.md': memory('weird', 'metadata:\n  type: opinion'),
}
const index = [...Object.keys(files), 'gone.md'].map((file) => `- [${file}](${file}) — hook`)
const root = fixture({
  ...files,
  'orphan.md': memory('orphan'),
  'MEMORY.md': `${index.join('\n')}\n`,
})
const report = readMemory(root)

const issuesOf = (file: string) =>
  report.issues.filter((issue) => issue.file === file).map(({ kind, detail }) => ({ kind, detail }))

test('a well-formed memory has nothing to report', () => {
  assert.deepEqual(issuesOf('good.md'), [])
})

test('a link resolves against names and filenames, with or without .md', () => {
  assert.deepEqual(issuesOf('linker.md'), [{ kind: 'broken-link', detail: '[[missing-one]]' }])
})

test('a file with no index line, and an index line with no file', () => {
  assert.deepEqual(issuesOf('orphan.md'), [{ kind: 'orphan', detail: 'no line in MEMORY.md' }])
  assert.deepEqual(issuesOf('MEMORY.md'), [{ kind: 'dead-index', detail: 'gone.md' }])
})

test('each way a frontmatter stops a memory working', () => {
  const kinds = (file: string) => issuesOf(file).map((issue) => issue.kind)
  assert.deepEqual(kinds('bare.md'), ['no-frontmatter'])
  assert.deepEqual(kinds('noname.md'), ['no-name'])
  assert.deepEqual(kinds('sentence.md'), ['name-not-slug'])
  assert.deepEqual(kinds('drift.md'), ['name-off-filename'])
  assert.deepEqual(kinds('nodesc.md'), ['no-description'])
  assert.deepEqual(kinds('rootype.md'), ['type-at-root'])
  assert.deepEqual(kinds('notype.md'), ['no-type'])
  assert.deepEqual(kinds('weird.md'), ['unknown-type'])
})

test('the index is counted apart from the memories it lists', () => {
  assert.equal(report.index?.entries, index.length)
  assert.equal(report.files.length, Object.keys(files).length + 1)
  assert.ok(!report.files.some((file) => file.file === 'MEMORY.md'))
})

test('no folder is an empty report rather than an error', () => {
  assert.deepEqual(readMemory(null).files, [])
  assert.equal(readMemory(path.join(root, 'nowhere'), 'other').sharedWith, 'other')
})
