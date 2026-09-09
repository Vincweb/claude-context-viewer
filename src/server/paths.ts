import fs from 'fs'
import os from 'os'
import path from 'path'

/**
 * The Claude Code folder a request is about. It comes from the URL — `?home=<path>` — so which
 * folder a page shows is the page's own business: two tabs can hold two, and a link to one survives
 * a reload. The server keeps no "current folder", only the default below for a URL that names none.
 */
export const defaultHome = () =>
  process.env.CLAUDE_CONFIG_DIR
    ? path.resolve(process.env.CLAUDE_CONFIG_DIR)
    : path.join(os.homedir(), '.claude')

export const expandHome = (value: string) =>
  value === '~' || value.startsWith('~/') ? path.join(os.homedir(), value.slice(1)) : value

/**
 * A Claude Code folder is one that holds a `projects/` directory. Anything else is refused: a path
 * taken from a URL must not turn this server into "list any directory on this machine".
 */
export const isClaudeHome = (dir: string) => {
  try {
    return fs.statSync(path.join(dir, 'projects')).isDirectory()
  } catch {
    return false
  }
}

export const resolveHome = (asked: string | null) => {
  const candidate = asked ? path.resolve(expandHome(asked)) : defaultHome()
  return isClaudeHome(candidate) ? candidate : null
}

export const projectsHome = (home: string) => path.join(home, 'projects')

/** A transcript, not the `.desktop-released.json` marker sitting beside it. */
export const isTranscript = (file: string) => file.endsWith('.jsonl')

export const sessionIdOf = (file: string) => file.slice(0, -'.jsonl'.length)

/**
 * Session ids are uuids and slugs are folder names that must already exist. Both arrive from a
 * query string, so both are checked against reality before anything is joined onto a path.
 */
const SESSION_ID = /^[0-9a-fA-F-]{1,64}$/

export const listSlugs = (home: string) => {
  const root = projectsHome(home)
  if (!fs.existsSync(root)) return []
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

export const resolveProject = (home: string, slug: string) => {
  if (!listSlugs(home).includes(slug)) return null
  return path.join(projectsHome(home), slug)
}

export const resolveTranscript = (home: string, slug: string, id: string) => {
  if (!SESSION_ID.test(id)) return null
  const dir = resolveProject(home, slug)
  if (!dir) return null
  const file = path.join(dir, `${id}.jsonl`)
  return fs.existsSync(file) ? file : null
}

/**
 * A worktree checkout, spotted by the path Claude Code encoded into the slug. Worktrees get their
 * own transcripts but share the memory of the checkout they came from, which is the thing this
 * page exists to make visible.
 */
export const looksLikeWorktree = (slugOrPath: string) =>
  /worktrees|-\.claude-worktrees-/.test(slugOrPath)

/** macOS reports the same temp folder both ways, and only one of them matches `os.tmpdir()`. */
const withoutPrivate = (value: string) => value.replace(/^\/private(?=\/)/, '')

/**
 * A folder Claude Code was pointed at under the system temp directory. Anything that drives the
 * CLI headlessly gets a throwaway directory per run — a menu-bar app polling `/usage`, a script
 * shelling out to the SDK — so these accumulate one project folder per invocation and bury the
 * repositories actually worked in.
 */
export const looksTransient = (cwdOrSlug: string) => {
  const value = withoutPrivate(cwdOrSlug)
  const temp = withoutPrivate(os.tmpdir()).replace(/\/+$/, '')
  return (
    value.startsWith(`${temp}/`) || value.startsWith('/tmp/') || value.startsWith('/var/folders/')
  )
}
