import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
import { test } from 'node:test'
import { readLinkedFile } from './files'
import { fixture } from './testing'

const root = fixture({
  'project/CLAUDE.md': 'See [the docs](docs/a.md).',
  'project/docs/a.md': 'hello',
  'project/image.png': 'PNG\0\0\0',
  'outside/secret.txt': 'not yours',
})
const project = path.join(root, 'project')
fs.symlinkSync(path.join(root, 'outside/secret.txt'), path.join(project, 'link.txt'))

const follow = (href: string, from = path.join(project, 'CLAUDE.md')) =>
  readLinkedFile({ from, href, roots: [project] })

/** A link that was followed, where a refusal fails the test. */
const found = (href: string, from?: string) => {
  const result = follow(href, from)
  if ('error' in result) assert.fail(`${href} was refused: ${result.error}`)
  return result
}

test('reads a link relative to the document holding it', () => {
  assert.deepEqual(found('docs/a.md#a-heading'), {
    path: path.join(project, 'docs/a.md'),
    kind: 'file',
    text: 'hello',
  })
})

test('lists a directory, and resolves from one', () => {
  const listing = found('docs')
  assert.equal(listing.kind, 'directory')
  assert.deepEqual(listing.kind === 'directory' && listing.entries, [
    { name: 'a.md', isDirectory: false },
  ])
  assert.equal(found('a.md', path.join(project, 'docs')).path, path.join(project, 'docs/a.md'))
})

test('refuses to climb out of the roots, encoded or not', () => {
  for (const href of ['../outside/secret.txt', '%2E%2E/outside/secret.txt', '/etc/hosts'])
    assert.ok('error' in follow(href), href)
})

test('refuses a symlink that lands outside the roots', () => {
  assert.ok('error' in follow('link.txt'))
})

test('says what it found rather than reading it', () => {
  assert.equal(found('image.png').kind, 'binary')
  assert.equal(found('nope.md').kind, 'missing')
})

test('a link that names no file is an error', () => {
  assert.ok('error' in follow('#only-a-fragment'))
})
