import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isAllowedHost } from './host'

test('answers to loopback, IP literals and localhost names', () => {
  for (const host of [
    '127.0.0.1:4700',
    'localhost:4700',
    'LOCALHOST',
    'localhost.',
    '[::1]:4700',
    'app.localhost:4700',
    '192.168.1.20:4700',
  ])
    assert.equal(isAllowedHost(host, '127.0.0.1'), true, host)
})

test('refuses a name that could be rebound to this machine', () => {
  for (const host of [
    'evil.example:4700',
    'localhost.evil.example',
    '127.0.0.1.nip.io',
    'evil:1@127.0.0.1',
  ])
    assert.equal(isAllowedHost(host, '127.0.0.1'), false, host)
})

test('answers to the name given to --host, and only then', () => {
  assert.equal(isAllowedHost('mymac.local:4700', 'mymac.local'), true)
  assert.equal(isAllowedHost('mymac.local:4700', '127.0.0.1'), false)
})

test('lets through a request with no Host at all, which no browser sends', () => {
  assert.equal(isAllowedHost(undefined, '127.0.0.1'), true)
})
