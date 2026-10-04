import assert from 'node:assert/strict'
import os from 'os'
import path from 'path'
import { test } from 'node:test'
import { looksLikeWorktree, looksTransient, resolveHome, resolveTranscript } from './paths'
import { fixture } from './testing'

const ID = '00000000-0000-4000-8000-000000000000'
const home = fixture({ [`projects/-Users-me-app/${ID}.jsonl`]: '' })

test('a Claude folder is one holding projects/', () => {
  assert.equal(resolveHome(home), home)
  assert.equal(resolveHome(path.join(home, 'projects')), null)
})

test('a transcript resolves only from a real slug and a session id', () => {
  assert.equal(
    resolveTranscript(home, '-Users-me-app', ID),
    path.join(home, 'projects/-Users-me-app', `${ID}.jsonl`),
  )
  assert.equal(resolveTranscript(home, '-Users-me-app', '../../secret'), null)
  assert.equal(resolveTranscript(home, '..', ID), null)
  assert.equal(resolveTranscript(home, '-Users-me-app', 'ffffffff'), null)
})

test('throwaway folders are spotted under the temp directories', () => {
  assert.equal(looksTransient(path.join(os.tmpdir(), 'run-1')), true)
  assert.equal(looksTransient('/tmp/run-1'), true)
  assert.equal(looksTransient('/Users/me/app'), false)
})

test('worktrees are spotted from the path', () => {
  assert.equal(looksLikeWorktree('/Users/me/app/.claude/worktrees/feature'), true)
  assert.equal(looksLikeWorktree('-Users-me-app--claude-worktrees-feature'), true)
  assert.equal(looksLikeWorktree('/Users/me/app'), false)
})
