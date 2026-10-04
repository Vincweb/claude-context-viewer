import fs from 'fs'
import os from 'os'
import path from 'path'
import { after } from 'node:test'

/**
 * A throwaway directory holding `files` (relative path → contents), removed once the test file
 * has run. Resolved through symlinks, so on macOS it is `/private/var/…` as `realpath` sees it.
 * Call it at the top level of a test file, where `after` belongs to the file.
 */
export const fixture = (files: Record<string, string>) => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'claude-context-viewer-')))
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(root, name)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
  }
  after(() => fs.rmSync(root, { recursive: true, force: true }))
  return root
}

/** One transcript line. */
export const record = (value: Record<string, unknown>) => `${JSON.stringify(value)}\n`
