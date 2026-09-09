import fs from 'fs'
import path from 'path'
import type { LinkedFile } from '../shared/types'

/** The same cap the instruction files use: generous for prose, small enough to stay a page. */
const MAX_BYTES = 256 * 1024
/** How much of a file is examined for a NUL byte before calling it binary. */
const SNIFF = 8 * 1024
/** A directory listing is a courtesy, not a file browser. */
const MAX_ENTRIES = 300

/**
 * A markdown link may carry a fragment (`file.md#a-heading`) or a query, and may be
 * percent-encoded. Only the path part names a file, and a malformed escape must not throw.
 */
const cleanHref = (href: string) => {
  const withoutFragment = href.split('#')[0]?.split('?')[0] ?? ''
  try {
    return decodeURIComponent(withoutFragment)
  } catch {
    return withoutFragment
  }
}

/**
 * Whether a resolved path sits inside one of the roots. `path.relative` is the check: a target
 * outside the root can only be reached by climbing out of it, so a relative path that starts with
 * `..` — or that is absolute, which happens across drives on Windows — is a refusal.
 */
const contained = (target: string, roots: string[]) =>
  roots.some((root) => {
    const rel = path.relative(root, target)
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
  })

const describe = (target: string): LinkedFile => {
  let stat: fs.Stats
  try {
    stat = fs.statSync(target)
  } catch {
    return { path: target, kind: 'missing' }
  }

  if (stat.isDirectory()) {
    try {
      const entries = fs
        .readdirSync(target, { withFileTypes: true })
        .filter((entry) => !entry.name.startsWith('.') || entry.name === '.claude')
        .slice(0, MAX_ENTRIES)
        .map((entry) => ({ name: entry.name, isDirectory: entry.isDirectory() }))
        .sort(
          (a, b) => Number(b.isDirectory) - Number(a.isDirectory) || a.name.localeCompare(b.name),
        )
      return { path: target, kind: 'directory', entries }
    } catch {
      return { path: target, kind: 'unreadable' }
    }
  }

  if (!stat.isFile()) return { path: target, kind: 'unreadable' }
  if (stat.size > MAX_BYTES) return { path: target, kind: 'too-large' }

  let buffer: Buffer
  try {
    buffer = fs.readFileSync(target)
  } catch {
    return { path: target, kind: 'unreadable' }
  }
  // A NUL byte, not a list of extensions: `.ts`, `.json` and `.yml` are all worth reading, and an
  // image or a compiled binary announces itself this way whatever it is called.
  if (buffer.subarray(0, SNIFF).includes(0)) return { path: target, kind: 'binary' }
  return { path: target, kind: 'file', text: buffer.toString('utf8') }
}

/**
 * The file a link inside a rendered document points at.
 *
 * Links in a CLAUDE.md are relative to the file that holds them — `../../.github/…` in
 * `apps/api/CLAUDE.md` means the repository root — so the resolution needs the document's own
 * path, not the project's. `roots` is what keeps this from becoming "read any file on this
 * machine": the target has to land inside the project or the Claude folder, both before and after
 * symlinks are followed.
 */
export const readLinkedFile = ({
  from,
  href,
  roots,
}: {
  from: string
  href: string
  roots: string[]
}): LinkedFile | { error: string } => {
  const relative = cleanHref(href)
  if (!relative) return { error: 'that link names no file' }

  // `from` is the document the link was in, or the directory a listing was showing.
  let base = path.dirname(from)
  try {
    if (fs.statSync(from).isDirectory()) base = from
  } catch {
    // Not on disk: the parent directory is still the right base.
  }

  const target = path.resolve(base, relative)
  let real = target
  try {
    real = fs.realpathSync(target)
  } catch {
    // Missing, or a broken symlink; the resolved path is what gets checked and reported.
  }

  if (!contained(target, roots) || !contained(real, roots))
    return { error: 'that link points outside this project' }

  return describe(target)
}
