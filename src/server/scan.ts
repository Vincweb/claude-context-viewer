import fs from 'fs'
import path from 'path'
import type { ProjectSummary, SessionPayload, SessionSummary } from '../shared/types'
import { readInstructionSources } from './instructions'
import { foldLayers } from './layers'
import { readMemory } from './memory'
import {
  isTranscript,
  listSlugs,
  looksLikeWorktree,
  looksTransient,
  projectsHome,
  resolveProject,
  resolveTranscript,
  sessionIdOf,
} from './paths'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asString = (value: unknown) => (typeof value === 'string' ? value : null)

const parseLine = (line: string) => {
  if (!line.trim()) return null
  try {
    const parsed: unknown = JSON.parse(line)
    return isRecord(parsed) ? parsed : null
  } catch {
    // A transcript being written to can end mid-line, and old sessions carry records this
    // version has never seen. Neither is a reason to fail the whole file.
    return null
  }
}

/** Enough of a transcript to describe it in a list, without reading a file that may be huge. */
const HEAD_BYTES = 256 * 1024

const readHead = (file: string) => {
  const handle = fs.openSync(file, 'r')
  try {
    const size = fs.fstatSync(handle).size
    const buffer = Buffer.alloc(Math.min(size, HEAD_BYTES))
    fs.readSync(handle, buffer, 0, buffer.length, 0)
    return buffer.toString('utf8')
  } finally {
    fs.closeSync(handle)
  }
}

/**
 * Enough of the end of a file to hold a whole record. A single record can be a large tool result,
 * so this is generous; it is still a fraction of a transcript that runs to megabytes.
 */
const TAIL_BYTES = 64 * 1024

const readTail = (file: string) => {
  const handle = fs.openSync(file, 'r')
  try {
    const size = fs.fstatSync(handle).size
    const length = Math.min(size, TAIL_BYTES)
    const buffer = Buffer.alloc(length)
    fs.readSync(handle, buffer, 0, length, size - length)
    return { text: buffer.toString('utf8'), fromStart: length === size }
  } finally {
    fs.closeSync(handle)
  }
}

/**
 * When a session last recorded something, taken from the transcript rather than the file's date.
 *
 * The two disagree: a file gets touched by a session that is resumed and writes nothing, and by
 * anything that copies it, so its date can sit days after the last thing anyone said. The last
 * record that carries a timestamp is what the session itself claims. The file's date remains the
 * fallback, for a transcript whose tail holds no timestamp at all.
 */
const lastRecordAt = (file: string, mtime: Date) => {
  let tail: { text: string; fromStart: boolean }
  try {
    tail = readTail(file)
  } catch {
    return mtime.toISOString()
  }
  const lines = tail.text.split('\n')
  // Unless the read caught the whole file it began mid-record, and that fragment cannot parse.
  if (!tail.fromStart) lines.shift()
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const record = parseLine(lines[index] ?? '')
    const stamp = record ? asString(record.timestamp) : null
    if (stamp && !Number.isNaN(Date.parse(stamp))) return stamp
  }
  return mtime.toISOString()
}

const firstPromptOf = (record: Record<string, unknown>) => {
  if (record.type === 'queue-operation') return asString(record.content)
  if (record.type !== 'user') return null
  const message = record.message
  if (!isRecord(message)) return null
  const content = message.content
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return null
  for (const part of content) {
    if (isRecord(part) && part.type === 'text') return asString(part.text)
  }
  return null
}

/**
 * What a session is, read from its first records. The folder name cannot be decoded back into a
 * path — the encoding replaces every separator with a dash, and a dash in a directory name is
 * indistinguishable from one — so the working directory is taken from the transcript instead.
 */
const peek = (file: string) => {
  const meta = {
    cwd: null as string | null,
    gitBranch: null as string | null,
    cliVersion: null as string | null,
    firstPrompt: null as string | null,
    title: null as string | null,
    startedAt: null as string | null,
    memoryIndex: null as string | null,
  }

  for (const line of readHead(file).split('\n')) {
    const record = parseLine(line)
    if (!record) continue
    meta.cwd ??= asString(record.cwd)
    meta.gitBranch ??= asString(record.gitBranch)
    meta.cliVersion ??= asString(record.version)
    meta.startedAt ??= asString(record.timestamp)
    meta.firstPrompt ??= firstPromptOf(record)
    if (record.type === 'custom-title') meta.title ??= asString(record.customTitle)

    // The memory folder a session actually loads from — a worktree's is not its own.
    if (record.type === 'attachment' && isRecord(record.attachment)) {
      const attachment = record.attachment
      if (attachment.type === 'instructions' && Array.isArray(attachment.files)) {
        for (const entry of attachment.files) {
          if (isRecord(entry) && entry.type === 'AutoMem') meta.memoryIndex ??= asString(entry.path)
        }
      }
    }
  }

  return meta
}

const transcriptsIn = (dir: string) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isTranscript(entry.name))
    .map((entry) => {
      const file = path.join(dir, entry.name)
      const stat = fs.statSync(file)
      return {
        file,
        id: sessionIdOf(entry.name),
        bytes: stat.size,
        lastActive: lastRecordAt(file, stat.mtime),
      }
    })
    .sort((a, b) => Date.parse(b.lastActive) - Date.parse(a.lastActive))

/**
 * The memories in a folder, which is not every `.md` in it: `MEMORY.md` is the index over them,
 * and counting it here would put this column one ahead of the project's own memory tab.
 */
const countMemoryFiles = (dir: string) => {
  const memory = path.join(dir, 'memory')
  if (!fs.existsSync(memory)) return 0
  return fs
    .readdirSync(memory)
    .filter((name) => name.endsWith('.md') && name.toUpperCase() !== 'MEMORY.MD').length
}

/**
 * Every project folder, described from its directory listing plus the head of its newest
 * transcript. Nothing here parses a whole session: the list is the first thing the page asks for,
 * and there can be dozens of folders holding tens of megabytes between them.
 */
export const scanProjects = (home: string): ProjectSummary[] =>
  listSlugs(home)
    .map((slug) => {
      const dir = path.join(projectsHome(home), slug)
      const transcripts = transcriptsIn(dir)
      const newest = transcripts[0]
      const meta = newest ? peek(newest.file) : null
      const cwd = meta?.cwd ?? null
      // `<home>/projects/<slug>/memory/MEMORY.md`, so two levels up is the folder that owns it.
      // A worktree is given the memory of its checkout, and this is the only record of which.
      const owner = meta?.memoryIndex
        ? path.basename(path.dirname(path.dirname(meta.memoryIndex)))
        : null
      return {
        slug,
        cwd,
        cwdExists: !!cwd && fs.existsSync(cwd),
        label: cwd ? path.basename(cwd) : slug,
        sessions: transcripts.length,
        lastActive: newest ? newest.lastActive : null,
        bytes: transcripts.reduce((total, one) => total + one.bytes, 0),
        memoryFiles: countMemoryFiles(dir),
        isWorktree: looksLikeWorktree(cwd ?? slug),
        parent: owner && owner !== slug ? owner : null,
        isTransient: looksTransient(cwd ?? slug.replace(/-/g, '/')),
      }
    })
    .sort((a, b) => (b.lastActive ?? '').localeCompare(a.lastActive ?? ''))

export const readSessions = (home: string, slug: string): SessionSummary[] | null => {
  const dir = resolveProject(home, slug)
  if (!dir) return null
  return transcriptsIn(dir).map(({ file, id, bytes, lastActive }) => {
    const meta = peek(file)
    return {
      id,
      startedAt: meta.startedAt,
      lastActive,
      bytes,
      gitBranch: meta.gitBranch,
      cliVersion: meta.cliVersion,
      firstPrompt: meta.firstPrompt,
      title: meta.title,
    }
  })
}

/**
 * A project's memory. A worktree has no `memory/` of its own: its sessions load the one belonging
 * to the checkout they were made from, and the transcript is the only place that says which — so
 * the folder is taken from the `AutoMem` entry a session was given, and only guessed at from the
 * slug when there is no session to ask.
 */
export const readProjectMemory = (home: string, slug: string) => {
  const dir = resolveProject(home, slug)
  if (!dir) return null

  const own = path.join(dir, 'memory')
  if (fs.existsSync(own)) return readMemory(own)

  const newest = transcriptsIn(dir)[0]
  const indexPath = newest ? peek(newest.file).memoryIndex : null
  if (!indexPath) return readMemory(null)

  const root = path.dirname(indexPath)
  return readMemory(root, path.basename(path.dirname(root)))
}

/**
 * Which instruction files this project's transcripts actually carried, and in how many sessions.
 *
 * A nested CLAUDE.md is injected the first time Claude touches a file under it, which can be
 * anywhere in a session — so unlike the session list, this reads whole transcripts. Only the lines
 * that mention one of the two attachment types are parsed, which keeps a 20 MB transcript cheap.
 */
const collectSeenPaths = (dir: string) => {
  const counts = new Map<string, number>()
  /**
   * Not every transcript records the instruction stack: a short SDK run, or a session from a CLI
   * old enough not to have written attachments, carries none. Those cannot say anything about
   * which CLAUDE.md loaded, so they must not sit in the denominator — "seen in 3 of 13" would
   * read as Claude having skipped the file ten times.
   */
  let recorded = 0

  for (const { file } of transcriptsIn(dir)) {
    const inThisSession = new Set<string>()
    let raw = ''
    try {
      raw = fs.readFileSync(file, 'utf8')
    } catch {
      continue
    }
    for (const line of raw.split('\n')) {
      if (!line.includes('"instructions"') && !line.includes('"nested_memory"')) continue
      const record = parseLine(line)
      if (!record || record.type !== 'attachment' || !isRecord(record.attachment)) continue
      const attachment = record.attachment
      if (attachment.type === 'instructions' && Array.isArray(attachment.files)) {
        for (const entry of attachment.files) {
          if (isRecord(entry)) {
            const where = asString(entry.path)
            if (where) inThisSession.add(where)
          }
        }
      }
      if (attachment.type === 'nested_memory') {
        const where = asString(attachment.path)
        if (where) inThisSession.add(where)
      }
    }
    if (inThisSession.size > 0) recorded += 1
    for (const where of inThisSession) counts.set(where, (counts.get(where) ?? 0) + 1)
  }

  return { counts, recorded }
}

export const readInstructions = (home: string, slug: string) => {
  const dir = resolveProject(home, slug)
  if (!dir) return null

  const transcripts = transcriptsIn(dir)
  const newest = transcripts[0]
  const meta = newest ? peek(newest.file) : null
  const { counts, recorded } = collectSeenPaths(dir)
  const { sources, truncated, cwdExists } = readInstructionSources({
    home,
    cwd: meta?.cwd ?? null,
    memoryIndex: meta?.memoryIndex ?? null,
    seen: counts,
  })

  return {
    cwd: meta?.cwd ?? null,
    cwdExists,
    sessions: transcripts.length,
    recorded,
    sources,
    truncated,
  }
}

/**
 * The directory this project's sessions ran in. Read from the newest transcript — the slug encodes
 * the path but turns every separator into a dash, which cannot be undone.
 */
export const projectCwd = (home: string, slug: string) => {
  const dir = resolveProject(home, slug)
  if (!dir) return null
  const newest = transcriptsIn(dir)[0]
  return newest ? peek(newest.file).cwd : null
}

export const readSession = (home: string, slug: string, id: string): SessionPayload | null => {
  const file = resolveTranscript(home, slug, id)
  if (!file) return null

  const attachments: { type: string; value: Record<string, unknown> }[] = []
  const messages = { user: 0, assistant: 0 }
  const meta = peek(file)
  let lastActive: string | null = null

  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const record = parseLine(line)
    if (!record) continue
    lastActive = asString(record.timestamp) ?? lastActive

    if (record.type === 'user') messages.user += 1
    if (record.type === 'assistant') messages.assistant += 1

    if (record.type === 'attachment' && isRecord(record.attachment)) {
      const type = asString(record.attachment.type)
      if (type) attachments.push({ type, value: record.attachment })
    }

    // Hooks can add context of their own, and it is injected the same way the rest is.
    if (record.type === 'system' && typeof record.hookAdditionalContext === 'string') {
      attachments.push({
        type: 'hook_context',
        value: { type: 'hook_context', text: record.hookAdditionalContext },
      })
    }
  }

  const layers = foldLayers(attachments)
  const chars = layers.reduce((total, layer) => total + layer.chars, 0)
  const stat = fs.statSync(file)

  return {
    slug,
    session: {
      id,
      startedAt: meta.startedAt,
      lastActive: lastActive ?? stat.mtime.toISOString(),
      bytes: stat.size,
      gitBranch: meta.gitBranch,
      cliVersion: meta.cliVersion,
      firstPrompt: meta.firstPrompt,
      title: meta.title,
    },
    cwd: meta.cwd,
    isWorktree: looksLikeWorktree(meta.cwd ?? slug),
    memoryRoot: meta.memoryIndex ? path.dirname(meta.memoryIndex) : null,
    layers,
    chars,
    tokens: Math.round(chars / 4),
    messages,
  }
}
