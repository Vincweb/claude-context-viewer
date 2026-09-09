import type { MemoryReport, ProjectSummary } from '../shared/types'
import type { Strings } from './i18n'

/** Everything the prompt needs to say plainly what removing one project folder costs. */
export type DeleteContext = {
  folder: string
  cwd: string | null
  cwdExists: boolean
  isWorktree: boolean
  sessions: number
  size: string
  /** Memory files that live in this folder, and would go with it. */
  memoryFiles: number
  /** Set when the memory these sessions read belongs to another project, and so is not at stake. */
  memoryElsewhere: string | null
}

export const deleteContext = ({
  project,
  memory,
  folder,
  size,
}: {
  project: ProjectSummary | undefined
  memory: MemoryReport
  folder: string
  size: string
}): DeleteContext => ({
  folder,
  cwd: project?.cwd ?? null,
  cwdExists: project?.cwdExists ?? false,
  isWorktree: project?.isWorktree ?? false,
  sessions: project?.sessions ?? 0,
  size,
  // A worktree reads the memory of the checkout it came from, and that folder is not this one.
  memoryFiles: memory.sharedWith ? 0 : memory.files.length,
  memoryElsewhere: memory.sharedWith ? memory.root : null,
})

/**
 * The prompt that removes one project folder. It asks for the listing first, because the whole
 * risk here is deleting the wrong folder, and it states what the folder is not: the repository
 * and its CLAUDE.md files live somewhere else entirely and are untouched.
 */
export const buildDeletePrompt = (context: DeleteContext, t: Strings) => t.remove.prompt(context)
