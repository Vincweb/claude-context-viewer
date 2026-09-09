import fs from 'fs'
import path from 'path'
import type { InstructionSource } from '../shared/types'

/** Where an organisation's pushed settings live, per platform. Instructions can arrive this way. */
const MANAGED = [
  '/Library/Application Support/ClaudeCode/managed-settings.json',
  '/etc/claude-code/managed-settings.json',
  'C:\\ProgramData\\ClaudeCode\\managed-settings.json',
]

const SKIP = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
  '.cache',
  'vendor',
])

/** Deep enough for a monorepo's `apps/x/y`, shallow enough not to walk a whole disk. */
const MAX_DEPTH = 6
const MAX_FILES = 200

const sizeOf = (file: string) => {
  try {
    return fs.statSync(file).size
  } catch {
    return 0
  }
}

/** Big enough for any instructions file anyone should have; a cap so a stray blob cannot hurt. */
const MAX_CONTENT = 256 * 1024

const contentOf = (file: string) => {
  try {
    const raw = fs.readFileSync(file, 'utf8')
    return raw.length > MAX_CONTENT ? `${raw.slice(0, MAX_CONTENT)}\n…` : raw
  } catch {
    return null
  }
}

/**
 * `@path` lines pull another file into a CLAUDE.md. They are resolved relative to the file that
 * names them, and `~` means the home directory.
 */
const importsIn = (file: string) => {
  let raw = ''
  try {
    raw = fs.readFileSync(file, 'utf8')
  } catch {
    return []
  }
  return [...raw.matchAll(/^@(\S+)\s*$/gm)]
    .map((match) => match[1] ?? '')
    .filter(Boolean)
    .map((target) =>
      target.startsWith('~')
        ? path.join(process.env.HOME ?? '', target.slice(1))
        : path.resolve(path.dirname(file), target),
    )
}

const walkForNested = (root: string) => {
  const found: string[] = []
  let truncated = false

  const visit = (dir: string, depth: number) => {
    if (truncated || depth > MAX_DEPTH) return
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (found.length >= MAX_FILES) {
        truncated = true
        return
      }
      if (entry.isFile() && entry.name === 'CLAUDE.md' && dir !== root)
        found.push(path.join(dir, entry.name))
      else if (entry.isDirectory() && !SKIP.has(entry.name) && !entry.name.startsWith('.'))
        visit(path.join(dir, entry.name), depth + 1)
    }
  }

  visit(root, 0)
  return { found: found.sort(), truncated }
}

/**
 * Every file that can put instructions into a session in this project, whether or not one of the
 * transcripts we have actually carried it.
 *
 * The transcript is the record of what *was* injected; this is the record of what *can* be. Both
 * are needed to answer "why isn't my CLAUDE.md being read": a file that exists, is never seen in
 * any session, and holds nothing is a different problem from one that is missing.
 */
export const readInstructionSources = ({
  home,
  cwd,
  memoryIndex,
  seen,
}: {
  home: string
  cwd: string | null
  memoryIndex: string | null
  /** Paths observed in this project's transcripts, and in how many of them. */
  seen: Map<string, number>
}) => {
  const sources: InstructionSource[] = []
  // The text rides along with the row: these files are small, and the page opens them in place.
  const add = (source: Omit<InstructionSource, 'content'>) =>
    sources.push({
      ...source,
      content:
        source.status === 'absent' || source.status === 'empty' ? null : contentOf(source.path),
    })
  const seenCount = (file: string) => seen.get(file) ?? 0

  const userFile = path.join(home, 'CLAUDE.md')
  const userSize = fs.existsSync(userFile) ? sizeOf(userFile) : -1
  add({
    kind: 'user',
    path: userFile,
    label: path.join(path.basename(home), 'CLAUDE.md'),
    status: userSize < 0 ? 'absent' : userSize === 0 ? 'empty' : 'start',
    chars: Math.max(userSize, 0),
    seenInSessions: seenCount(userFile),
    note:
      userSize === 0
        ? 'exists but is empty, so nothing is injected from it'
        : userSize < 0
          ? 'your own instructions for every project would go here'
          : null,
  })

  const managed = MANAGED.find((file) => fs.existsSync(file))
  add({
    kind: 'managed',
    path: managed ?? MANAGED[0]!,
    label: 'managed settings',
    status: managed ? 'start' : 'absent',
    chars: managed ? sizeOf(managed) : 0,
    seenInSessions: 0,
    note: managed
      ? 'pushed by your organisation — read it to see what it enforces'
      : 'nothing pushed by an organisation on this machine',
  })

  if (memoryIndex) {
    add({
      kind: 'memory-index',
      path: memoryIndex,
      label: 'auto-memory index (MEMORY.md)',
      status: fs.existsSync(memoryIndex) ? 'start' : 'absent',
      chars: sizeOf(memoryIndex),
      seenInSessions: seenCount(memoryIndex),
      note: 'loaded whole on every session; the individual memories are recalled as needed',
    })
  }

  let truncated = false
  const cwdExists = !!cwd && fs.existsSync(cwd) && fs.statSync(cwd).isDirectory()

  if (cwd && cwdExists) {
    const relative = (file: string) => path.relative(cwd, file) || path.basename(file)

    for (const [candidate, kind, note] of [
      [path.join(cwd, 'CLAUDE.md'), 'project', 'the repository’s own instructions'],
      [path.join(cwd, 'CLAUDE.local.md'), 'local', 'yours, not committed'],
      [path.join(cwd, '.claude', 'CLAUDE.md'), 'project', null],
    ] as const) {
      const exists = fs.existsSync(candidate)
      // Optional locations only earn a row once they exist — an absent one is not a finding.
      if (!exists && candidate !== path.join(cwd, 'CLAUDE.md')) continue
      const size = exists ? sizeOf(candidate) : -1
      add({
        kind,
        path: candidate,
        label: relative(candidate),
        status: size < 0 ? 'absent' : size === 0 ? 'empty' : 'start',
        chars: Math.max(size, 0),
        seenInSessions: seenCount(candidate),
        note,
      })
    }

    const nested = walkForNested(cwd)
    truncated = nested.truncated
    for (const file of nested.found) {
      add({
        kind: 'nested',
        path: file,
        label: relative(file),
        status: 'on-demand',
        chars: sizeOf(file),
        seenInSessions: seenCount(file),
        note: null,
      })
    }

    for (const parent of [path.join(cwd, 'CLAUDE.md'), ...nested.found]) {
      for (const target of importsIn(parent)) {
        add({
          kind: 'import',
          path: target,
          label: `${relative(parent)} → ${relative(target)}`,
          status: fs.existsSync(target) ? 'start' : 'absent',
          chars: sizeOf(target),
          seenInSessions: seenCount(target),
          note: 'pulled in by an @import',
        })
      }
    }
  }

  return { sources, truncated, cwdExists }
}
