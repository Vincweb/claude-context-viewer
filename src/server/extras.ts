import fs from 'fs'
import path from 'path'
import type { ExtraFile, ExtraKind } from '../shared/types'
import { isTranscript, resolveProject } from './paths'

/** A folder holding a runaway number of spilled results should not stall the page. */
const MAX_FILES = 600

/** `{ agentType, description, spawnDepth }` sits beside every sub-agent transcript. */
const readAgentMeta = (file: string) => {
  try {
    const raw: unknown = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (typeof raw !== 'object' || raw === null) return null
    const record = raw as Record<string, unknown>
    return {
      agentType: typeof record.agentType === 'string' ? record.agentType : null,
      description: typeof record.description === 'string' ? record.description : null,
      spawnDepth: typeof record.spawnDepth === 'number' ? record.spawnDepth : null,
    }
  } catch {
    return null
  }
}

const classify = (segments: string[], name: string): ExtraKind => {
  if (segments.includes('subagents')) return 'subagent'
  if (segments.includes('tool-results')) return 'tool-result'
  if (segments.includes('workflows')) return 'workflow'
  if (name.startsWith('artifact')) return 'artifact'
  if (name.startsWith('hook-')) return 'hook'
  if (name.endsWith('.desktop-released.json')) return 'released'
  if (name === 'sessions-index.json') return 'index'
  return 'other'
}

/**
 * Everything in a project folder that is neither a session transcript nor a memory file.
 *
 * A folder holds more than the two things the rest of this page reads. A session that spawned
 * sub-agents has their transcripts in a subdirectory of its own — each one a context window the
 * session's own numbers know nothing about, because only the sub-agent's final report came back.
 * A tool result too large to sit inline is spilled to a file beside it. Workflows, published
 * artifacts, hook output and the desktop app's own markers land here too. None of it shows up
 * anywhere else, and all of it is on disk under the folder you would remove.
 */
export const readProjectExtras = (home: string, slug: string) => {
  const root = resolveProject(home, slug)
  if (!root) return null

  const files: ExtraFile[] = []
  let truncated = false

  const walk = (dir: string, depth: number) => {
    if (truncated || depth > 4) return
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (files.length >= MAX_FILES) {
        truncated = true
        return
      }
      const full = path.join(dir, entry.name)
      const relative = path.relative(root, full)
      const segments = relative.split(path.sep)

      if (entry.isDirectory()) {
        // The memory folder has a tab of its own; everything else is worth walking into.
        if (segments.length === 1 && entry.name === 'memory') continue
        walk(full, depth + 1)
        continue
      }

      // A transcript at the top level is a session, and the sessions tab lists those.
      if (segments.length === 1 && isTranscript(entry.name)) continue
      // Folded into the sub-agent transcript it describes rather than listed on its own.
      if (entry.name.endsWith('.meta.json')) continue

      let bytes = 0
      try {
        bytes = fs.statSync(full).size
      } catch {
        continue
      }

      const kind = classify(segments, entry.name)
      const meta =
        kind === 'subagent' ? readAgentMeta(full.replace(/\.jsonl$/, '.meta.json')) : null

      files.push({
        kind,
        path: relative,
        bytes,
        // A file under a session's own subdirectory belongs to that session.
        session: segments.length > 1 ? (segments[0] ?? null) : null,
        label: meta?.agentType ?? null,
        detail: meta?.description ?? null,
      })
    }
  }

  walk(root, 0)
  files.sort((a, b) => a.kind.localeCompare(b.kind) || b.bytes - a.bytes)

  return {
    files,
    bytes: files.reduce((total, file) => total + file.bytes, 0),
    truncated,
  }
}
