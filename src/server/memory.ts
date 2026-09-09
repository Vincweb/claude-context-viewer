import fs from 'fs'
import path from 'path'
import type { MemoryFile, MemoryIssue, MemoryReport } from '../shared/types'

/**
 * A memory file opens with YAML frontmatter — `name`, `description`, `metadata.type`. Only three
 * scalars are read out of it, so this stays a few regexes rather than a YAML dependency: anything
 * it fails to recognise shows up as a null in the table, which is itself worth seeing.
 */
const readFrontmatter = (raw: string) => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  if (!match?.[1]) return { name: null, description: null, kind: null, body: raw, head: null }
  const head = match[1]
  const scalar = (key: string) => {
    const found = new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm').exec(head)
    return found?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? null
  }
  return {
    name: scalar('name'),
    description: scalar('description'),
    kind: scalar('type'),
    body: raw.slice(match[0].length).trim(),
    /** The frontmatter as written, which is the only way to see *where* a key sits. */
    head,
  }
}

/** The four kinds a memory can be, from the instructions that ask for one. */
const KINDS = new Set(['user', 'feedback', 'project', 'reference'])

/** A slug: lowercase, and joined by dashes or underscores — whichever the folder settled on. */
const SLUG = /^[a-z0-9]+([-_][a-z0-9]+)*$/

/**
 * Whether a memory is built the way recall expects.
 *
 * These are the faults that stop a file working rather than the ones that make it less tidy: a
 * `name:` that is a sentence cannot be linked to, a missing `description:` leaves nothing to judge
 * relevance by, and a `type:` written at the frontmatter root instead of under `metadata:` is read
 * as no type at all. Style is deliberately left alone — measured against a real folder, checking
 * for the `**Why:**` and `**How to apply:**` lines, or for a one-line description, flagged more
 * than half the files, which buries the faults that matter.
 */
const shapeIssues = (file: {
  file: string
  name: string | null
  description: string | null
  kind: string | null
  head: string | null
}): MemoryIssue[] => {
  const issues: MemoryIssue[] = []
  const at = (kind: MemoryIssue['kind'], detail = '') =>
    issues.push({ kind, file: file.file, detail })

  if (file.head === null) {
    // Without frontmatter there is no name, description or type to check; one finding says it all.
    at('no-frontmatter')
    return issues
  }

  if (!file.name) at('no-name')
  else if (!SLUG.test(file.name)) at('name-not-slug', file.name)
  else if (file.name !== file.file.replace(/\.md$/i, '')) at('name-off-filename', file.name)

  if (!file.description) at('no-description')

  // `type:` belongs under `metadata:`; at the root it is not the field the instructions ask for.
  if (/^type:/m.test(file.head)) at('type-at-root', file.kind ?? '')
  else if (!/^\s+type:/m.test(file.head)) at('no-type')
  else if (file.kind && !KINDS.has(file.kind.toLowerCase())) at('unknown-type', file.kind)

  return issues
}

/** Every `[[other-memory]]` the body points at. */
const linksIn = (body: string) =>
  [...body.matchAll(/\[\[([^\]]+)\]\]/g)].map((match) => match[1]?.trim() ?? '').filter(Boolean)

/** The index is a flat list of `- [Title](file.md) — hook` lines. */
const indexTargets = (raw: string) =>
  [...raw.matchAll(/^\s*[-*]\s*\[[^\]]*\]\(([^)]+)\)/gm)].map((match) => match[1] ?? '')

const EMPTY: MemoryReport = {
  root: null,
  sharedWith: null,
  index: null,
  files: [],
  issues: [],
  chars: 0,
}

/**
 * What is in a memory folder and what does not add up in it. The three checks are the ones that
 * rot silently: a `[[link]]` to a memory that was never written, a file the index never got a line
 * for (so it is only ever recalled by luck), and an index line pointing at a file that is gone.
 */
export const readMemory = (root: string | null, sharedWith: string | null = null): MemoryReport => {
  if (!root || !fs.existsSync(root)) return { ...EMPTY, sharedWith }

  const entries = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort()

  const indexFile = entries.find((name) => name.toUpperCase() === 'MEMORY.MD') ?? null
  const indexRaw = indexFile ? fs.readFileSync(path.join(root, indexFile), 'utf8') : null

  const shape: MemoryIssue[] = []
  const files: MemoryFile[] = entries
    .filter((name) => name !== indexFile)
    .map((name) => {
      const raw = fs.readFileSync(path.join(root, name), 'utf8')
      const { name: slug, description, kind, body, head } = readFrontmatter(raw)
      shape.push(...shapeIssues({ file: name, name: slug, description, kind, head }))
      return {
        file: name,
        name: slug,
        description,
        kind,
        chars: raw.length,
        links: linksIn(body),
        body,
      }
    })

  // A link resolves against the `name:` in the frontmatter, and against the filename too: the two
  // are meant to match, and a file whose name drifted from its slug should not read as broken.
  // A `.md` written inside the brackets is dropped on both sides — the extension is a typo, not a
  // different memory. Underscores and dashes are left alone: recall matches the slug exactly, so
  // `[[feedback-slack-approval]]` really does miss `feedback_slack_approval`.
  const stem = (value: string) => value.replace(/\.md$/i, '')
  const known = new Set<string>()
  for (const file of files) {
    if (file.name) known.add(stem(file.name))
    known.add(stem(file.file))
  }

  const targets = indexRaw ? indexTargets(indexRaw) : []
  const indexed = new Set(targets)
  const onDisk = new Set(files.map((file) => file.file))

  const issues: MemoryIssue[] = [...shape]
  for (const file of files) {
    for (const link of file.links) {
      if (!known.has(stem(link)))
        issues.push({ kind: 'broken-link', file: file.file, detail: `[[${link}]]` })
    }
    if (indexRaw && !indexed.has(file.file))
      issues.push({ kind: 'orphan', file: file.file, detail: 'no line in MEMORY.md' })
  }
  for (const target of targets) {
    if (!onDisk.has(target))
      issues.push({ kind: 'dead-index', file: indexFile ?? 'MEMORY.md', detail: target })
  }

  return {
    root,
    sharedWith,
    index: indexRaw ? { chars: indexRaw.length, entries: targets.length, content: indexRaw } : null,
    files,
    issues,
    chars: (indexRaw?.length ?? 0) + files.reduce((total, file) => total + file.chars, 0),
  }
}
