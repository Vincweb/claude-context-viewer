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
