/** One Claude Code folder the picker can offer. */
export type HomeCandidate = {
  path: string
  /** `~/…` when it sits under the home directory. */
  label: string
  isDefault: boolean
  projects: number
  memoryFolders: number
  lastActive: string | null
}

export type HomesPayload = {
  default: string
  candidates: HomeCandidate[]
  version: string
}

/** One `<home>/projects/<slug>` folder. */
export type ProjectSummary = {
  slug: string
  /** The working directory the sessions ran in, read from a transcript — the slug is ambiguous. */
  cwd: string | null
  /** Whether that directory is still on disk. False for a checkout or worktree since removed. */
  cwdExists: boolean
  label: string
  sessions: number
  /** ISO date of the newest transcript. */
  lastActive: string | null
  bytes: number
  /** How many `.md` files sit in this folder's own `memory/`, when it has one. */
  memoryFiles: number
  isWorktree: boolean
  /**
   * The project folder whose auto-memory these sessions load, when it is not this one — which is
   * how a worktree names the checkout it was made from. Null for a folder that owns its memory.
   */
  parent: string | null
  /** A throwaway directory under the system temp folder — a headless run, not a repository. */
  isTransient: boolean
}

export type ProjectsPayload = {
  home: string
  version: string
  projects: ProjectSummary[]
}

export type SessionSummary = {
  id: string
  startedAt: string | null
  lastActive: string | null
  bytes: number
  gitBranch: string | null
  cliVersion: string | null
  /** The first thing typed, so a session is recognisable without opening it. */
  firstPrompt: string | null
  title: string | null
}

/**
 * Something that does not add up in a memory folder: a link or an index entry that leads nowhere,
 * or a file whose frontmatter is shaped in a way that stops it being recalled or linked to.
 */
export type MemoryIssue = {
  kind:
    | 'broken-link'
    | 'orphan'
    | 'dead-index'
    | 'no-frontmatter'
    | 'no-name'
    | 'name-not-slug'
    | 'name-off-filename'
    | 'no-description'
    | 'type-at-root'
    | 'no-type'
    | 'unknown-type'
  file: string
  detail: string
}

export type MemoryFile = {
  file: string
  name: string | null
  description: string | null
  kind: string | null
  chars: number
  links: string[]
  body: string
}

export type MemoryReport = {
  /** Null when this project has no memory folder of its own — a worktree, typically. */
  root: string | null
  /** Set when the sessions load their memory from another project's folder. */
  sharedWith: string | null
  index: { chars: number; entries: number; content: string } | null
  files: MemoryFile[]
  issues: MemoryIssue[]
  chars: number
}

export type ProjectPayload = {
  project: ProjectSummary
  sessions: SessionSummary[]
  memory: MemoryReport
}

export type LayerBlock = {
  title: string
  chars: number
  text: string
  /**
   * What makes this block the same block on a later injection — a file path, typically. Two
   * records can name one file differently (`packages/db/CLAUDE.md` and `CLAUDE.md`), so folding
   * on the title alone would count that file twice.
   */
  key: string
}

/** Which part of the prompt a layer belongs to, so the page can group them. */
export type LayerGroup = 'system' | 'instructions' | 'capabilities' | 'session' | 'runtime'

export type Layer = {
  type: string
  label: string
  group: LayerGroup
  chars: number
  /** A rough count: characters over four. The page says so. */
  tokens: number
  /** How many times this layer was injected — per turn for some of them. */
  occurrences: number
  blocks: LayerBlock[]
}

export type SessionPayload = {
  slug: string
  session: SessionSummary
  cwd: string | null
  isWorktree: boolean
  memoryRoot: string | null
  layers: Layer[]
  chars: number
  tokens: number
  /** Messages are counted but not shown: this page is about what is injected, not what was said. */
  messages: { user: number; assistant: number }
}

/** One file that can put instructions into a session. */
export type InstructionSource = {
  kind: 'user' | 'managed' | 'project' | 'local' | 'nested' | 'import' | 'memory-index'
  path: string
  /** Relative to the project when that reads better than the absolute path. */
  label: string
  /**
   * `start` loads with the session, `on-demand` the first time Claude touches that subtree,
   * `empty` exists but has nothing to inject, `absent` is not on disk at all.
   */
  status: 'start' | 'on-demand' | 'empty' | 'absent'
  chars: number
  /** How many of this project's transcripts actually carried it. */
  seenInSessions: number
  note: string | null
  /** The file itself, so a row can be opened; null when there is nothing on disk to show. */
  content: string | null
}

export type InstructionsPayload = {
  cwd: string | null
  cwdExists: boolean
  sessions: number
  /** Transcripts that recorded an instruction stack at all — the only fair denominator. */
  recorded: number
  sources: InstructionSource[]
  /** True when the walk hit its file cap and stopped looking. */
  truncated: boolean
}

/**
 * What a link inside a rendered document points at. A link in a CLAUDE.md is a path on disk, not
 * a URL, so following one means reading that path — and reporting what it turned out to be.
 */
export type LinkedFile =
  | { path: string; kind: 'file'; text: string }
  | { path: string; kind: 'directory'; entries: { name: string; isDirectory: boolean }[] }
  | { path: string; kind: 'missing' | 'binary' | 'too-large' | 'unreadable' }

/** What kind of thing a file in a project folder is, when it is neither transcript nor memory. */
export type ExtraKind =
  'subagent' | 'tool-result' | 'workflow' | 'artifact' | 'hook' | 'released' | 'index' | 'other'

export type ExtraFile = {
  kind: ExtraKind
  /** Relative to the project folder. */
  path: string
  bytes: number
  /** The session whose subdirectory holds it, when it sits in one. */
  session: string | null
  /** A sub-agent's type, from the meta file beside its transcript. */
  label: string | null
  /** What that sub-agent was asked to do. */
  detail: string | null
}

export type ExtrasPayload = {
  files: ExtraFile[]
  bytes: number
  /** True when the walk hit its file cap and stopped looking. */
  truncated: boolean
}
