import type { MemoryReport } from '../shared/types'
import type { Strings } from './i18n'

/** What the prompt needs to know about each problem, gathered from the report. */
export type FixContext = {
  root: string
  broken: { file: string; link: string; candidates: string[] }[]
  orphans: { file: string; name: string | null; description: string | null }[]
  dead: string[]
  /** A file whose frontmatter is shaped in a way that stops it being recalled or linked to. */
  shape: { file: string; kind: string; detail: string; name: string | null }[]
}

/** `feedback-slack-approval` and `feedback_slack_approval.md` are the same word to a person. */
const loose = (value: string) =>
  value
    .toLowerCase()
    .replace(/\.md$/, '')
    .replace(/[-_\s]+/g, '')

/**
 * The prompt that asks Claude Code to repair the folder. Everything the page knows about a problem
 * goes in: the exact file, the exact link, and — for a broken link — the existing slugs that are
 * the same word spelt differently, since that is what most broken links turn out to be. The
 * wording lives in the dictionaries; this only gathers the facts.
 */
export const buildFixPrompt = (memory: MemoryReport, t: Strings) => {
  const slugs = memory.files.flatMap((file) =>
    [file.name, file.file.replace(/\.md$/, '')].filter((slug): slug is string => !!slug),
  )
  const unique = [...new Set(slugs)]

  const context: FixContext = {
    root: memory.root ?? '',
    broken: memory.issues
      .filter((issue) => issue.kind === 'broken-link')
      .map((issue) => {
        const link = issue.detail.replace(/^\[\[|\]\]$/g, '')
        const wanted = loose(link)
        return {
          file: issue.file,
          link,
          candidates: unique.filter((slug) => loose(slug) === wanted),
        }
      }),
    orphans: memory.issues
      .filter((issue) => issue.kind === 'orphan')
      .map((issue) => {
        const file = memory.files.find((candidate) => candidate.file === issue.file)
        return {
          file: issue.file,
          name: file?.name ?? null,
          description: file?.description ?? null,
        }
      }),
    dead: memory.issues.filter((issue) => issue.kind === 'dead-index').map((issue) => issue.detail),
    shape: memory.issues
      .filter((issue) => !['broken-link', 'orphan', 'dead-index'].includes(issue.kind))
      .map((issue) => ({
        file: issue.file,
        kind: issue.kind,
        detail: issue.detail,
        name: memory.files.find((file) => file.file === issue.file)?.name ?? null,
      })),
  }

  return t.fix.prompt(context)
}
