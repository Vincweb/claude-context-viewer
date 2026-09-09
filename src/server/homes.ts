import fs from 'fs'
import os from 'os'
import path from 'path'
import type { HomeCandidate } from '../shared/types'
import { defaultHome, expandHome, isClaudeHome, listSlugs, projectsHome } from './paths'

/** A folder described from its directory listing alone — the picker must open instantly. */
export const describeHome = (dir: string): HomeCandidate => {
  const slugs = listSlugs(dir)
  let lastActive: Date | null = null
  let memoryFolders = 0
  for (const slug of slugs) {
    const folder = path.join(projectsHome(dir), slug)
    try {
      const modified = fs.statSync(folder).mtime
      if (!lastActive || modified > lastActive) lastActive = modified
      // A `memory/` folder is created empty for every session, throwaway ones included; only one
      // holding a memory file has anything to say.
      const memory = path.join(folder, 'memory')
      if (fs.existsSync(memory) && fs.readdirSync(memory).some((name) => name.endsWith('.md')))
        memoryFolders += 1
    } catch {
      // A folder removed between the listing and the stat is not worth failing the picker for.
    }
  }
  return {
    path: dir,
    label: dir.startsWith(os.homedir()) ? `~${dir.slice(os.homedir().length)}` : dir,
    isDefault: dir === defaultHome(),
    projects: slugs.length,
    memoryFolders,
    lastActive: lastActive ? lastActive.toISOString() : null,
  }
}

/**
 * The folders worth offering: the default, whatever `CLAUDE_CONFIG_DIR` points at, and any
 * `~/.claude-*` sibling — the usual shape of a second profile. A bounded readdir of the home
 * directory, never a walk of it.
 */
export const discoverHomes = () => {
  const found = new Set<string>([defaultHome()])
  if (process.env.CLAUDE_CONFIG_DIR) found.add(path.resolve(process.env.CLAUDE_CONFIG_DIR))
  try {
    for (const entry of fs.readdirSync(os.homedir(), { withFileTypes: true })) {
      if (entry.isDirectory() && /^\.claude(-|$)/.test(entry.name))
        found.add(path.join(os.homedir(), entry.name))
    }
  } catch {
    // An unreadable home directory leaves the default alone in the list.
  }
  return [...found].filter(isClaudeHome).map(describeHome)
}

/** What the path field gets back: the folder described, or why it was refused. */
export const checkHome = (asked: string) => {
  const dir = path.resolve(expandHome(asked.trim()))
  if (!fs.existsSync(dir)) return { error: `nothing at ${dir}` }
  if (!fs.statSync(dir).isDirectory()) return { error: `${dir} is a file, not a folder` }
  if (!isClaudeHome(dir))
    return { error: `${dir} has no projects/ folder — it is not a Claude Code folder` }
  return { home: describeHome(dir) }
}
