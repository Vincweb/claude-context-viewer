import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pageUrl } from './browser'

test('a bound address is the one to visit', () => {
  assert.equal(pageUrl('127.0.0.1', 4700), 'http://127.0.0.1:4700')
  assert.equal(pageUrl('localhost', 4700), 'http://localhost:4700')
})

test('a wildcard bind is visited on loopback', () => {
  assert.equal(pageUrl('0.0.0.0', 4700), 'http://127.0.0.1:4700')
  assert.equal(pageUrl('::', 4700), 'http://[::1]:4700')
})

test('an IPv6 literal gets its brackets', () => {
  assert.equal(pageUrl('::1', 4700), 'http://[::1]:4700')
})
