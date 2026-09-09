import { useState, type ReactNode } from 'react'
import { WELCOME_PATH, projectPath } from '../../shared/routes'
import type { ProjectSummary } from '../../shared/types'
import { cx } from '../cx'
import { bytes, useWhen } from '../format'
import { useT } from '../i18n'
import { useLiveRows } from '../live'
import { useProjects } from '../queries'
import type { Watch } from '../watch'
import { ProjectsDiagram } from './ProjectsDiagram'
import { UpdateButton } from './UpdateButton'
import { BackLink, Badge, Eyebrow, Failed, Link, Loading, Mono, Muted, Panel, Rise } from './ui'

/** A checkout and the worktrees made from it: the worktrees load its memory, which is how they
 * name it. A folder whose parent is not itself on show stands on its own. */
type Group = { lead: ProjectSummary; children: ProjectSummary[] }

const newestIn = (group: Group) =>
  [group.lead, ...group.children].reduce(
    (latest, project) =>
      project.lastActive && project.lastActive > latest ? project.lastActive : latest,
    '',
  )

const byActivity = (a: ProjectSummary, b: ProjectSummary) =>
  (b.lastActive ?? '').localeCompare(a.lastActive ?? '')

const group = (projects: ProjectSummary[]): Group[] => {
  const present = new Set(projects.map((project) => project.slug))
  const children = new Map<string, ProjectSummary[]>()
  const leads: ProjectSummary[] = []

  for (const project of projects) {
    const parent = project.parent && present.has(project.parent) ? project.parent : null
    if (parent) children.set(parent, [...(children.get(parent) ?? []), project])
    else leads.push(project)
  }

  return (
    leads
      .map((lead) => ({ lead, children: (children.get(lead.slug) ?? []).sort(byActivity) }))
      // A group is as recent as the most recent thing in it, so work in a worktree floats its
      // checkout up the list rather than leaving it stranded where it was last touched directly.
      .sort((a, b) => newestIn(b).localeCompare(newestIn(a)))
  )
}

/**
 * One figure in a project's row. A cell above `sm`; below it, a line carrying the column's own
 * heading, since the heading row is gone and a bare number would say nothing.
 */
const Figure = ({
  label,
  children,
  last = false,
}: {
  label: string
  children: ReactNode
  last?: boolean
}) => (
  <td
    className={cx(
      'flex items-baseline justify-between gap-3 px-4 py-0.5 whitespace-nowrap tabular-nums sm:table-cell sm:py-2.5',
      last && 'pb-2.5',
    )}
  >
    <span className="text-muted sm:hidden">{label}</span>
    <span>{children}</span>
  </td>
)

export const ProjectsView = ({ home, watch }: { home: string; watch: Watch }) => {
  const t = useT()
  const when = useWhen()
  const { data, error, isPending } = useProjects(home)
  const [query, setQuery] = useState('')
  // Hidden by default: anything driving the CLI headlessly gets a throwaway directory per run,
  // and on this machine those outnumber the real repositories three to one.
  const [showTransient, setShowTransient] = useState(false)

  const needle = query.trim().toLowerCase()
  const matching = (data?.projects ?? []).filter(
    (project) =>
      (showTransient || !project.isTransient) &&
      (!needle || `${project.label} ${project.cwd ?? project.slug}`.toLowerCase().includes(needle)),
  )
  const groups = group(matching)
  /**
   * The order the table is drawn in — a checkout, then the worktrees made from it, then the next
   * checkout — flattened, because a row of a table cannot be nested inside another. `tie` marks a
   * worktree, which is drawn joined to the checkout above it, and `last` closes the group.
   */
  const order = groups.flatMap((one) => [
    { slug: one.lead.slug, project: one.lead, tie: false, last: one.children.length === 0 },
    ...one.children.map((child, index) => ({
      slug: child.slug,
      project: child,
      tie: true,
      last: index === one.children.length - 1,
    })),
  ])

  // Called before the early returns, so the hook order never changes between renders.
  const rowRef = useLiveRows(order.map((row) => row.slug))

  if (isPending) return <Loading what={t.projects.loading} />
  if (error) return <Failed error={error} />

  const transient = data.projects.filter((project) => project.isTransient).length
  const shown = matching

  return (
    <>
      <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <Rise>
          <section>
            <div className="flex items-center gap-3">
              <BackLink to={WELCOME_PATH} label={t.ui.backToPicker} />
              <h1 className="font-serif text-[28px] leading-tight tracking-tight">
                {t.projects.title}
              </h1>
            </div>
            <p className="mt-2 max-w-2xl text-muted">{t.projects.intro}</p>
          </section>
        </Rise>
        <Rise index={1}>
          <Panel className="p-4">
            <ProjectsDiagram />
          </Panel>
        </Rise>
      </div>

      <Rise index={2}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Eyebrow>{t.projects.count(shown.length, data.projects.length)}</Eyebrow>
          {transient > 0 && (
            <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-muted transition-colors select-none hover:text-text">
              <input
                type="checkbox"
                checked={showTransient}
                onChange={(event) => setShowTransient(event.target.checked)}
                className="accent-accent"
              />
              {t.projects.includeTemporary(transient)}
            </label>
          )}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.projects.filterPlaceholder}
            aria-label={t.projects.filterAria}
            // Right-aligned with the rest when there are no throwaway folders to offer, since the
            // checkbox that would otherwise push the group over is not drawn at all.
            className={cx(
              'w-56 rounded-lg border border-line bg-panel px-3 py-1.5 outline-none transition-colors placeholder:text-faint focus:border-accent',
              transient === 0 && 'ml-auto',
            )}
          />
          <UpdateButton watch={watch} />
        </div>
      </Rise>

      <Rise index={3}>
        <Panel className="overflow-hidden">
          {/* A five-column table has nowhere to go on a phone, so below `sm` every part of it is
              told to be a block: the head disappears and each row becomes the project, then its
              figures as labelled lines. Above `sm` it is a table again, and scrolls if it must. */}
          <div className="sm:overflow-x-auto">
            <table className="block w-full border-collapse sm:table">
              <thead className="hidden sm:table-header-group">
                <tr className="border-b border-line-soft text-left text-faint">
                  <th className="w-[46%] px-4 py-2.5 font-medium">{t.projects.columns.project}</th>
                  <th className="px-4 py-2.5 font-medium">{t.projects.columns.sessions}</th>
                  <th className="px-4 py-2.5 font-medium">{t.projects.columns.memory}</th>
                  <th className="px-4 py-2.5 font-medium">{t.projects.columns.transcripts}</th>
                  <th className="px-4 py-2.5 font-medium">{t.projects.columns.lastActive}</th>
                </tr>
              </thead>
              <tbody className="block sm:table-row-group">
                {order.map(({ slug, project, tie, last }, index) => (
                  <tr
                    key={slug}
                    ref={rowRef(slug)}
                    // A soft rule, repeated down a long table: `line` would read as a grid drawn
                    // over the rows rather than as the gap between them. What groups a checkout
                    // with its worktrees is the branch on the left, not a heavier rule.
                    className="animate-rise block border-b border-line-soft last:border-0 hover:bg-code-bg sm:table-row"
                    style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
                  >
                    <td
                      // `max-w-0` is what lets the name and the path ellipsize in a table cell,
                      // and exactly what crushes them to nothing once the row is a block.
                      className={cx(
                        'relative block pt-2.5 pr-4 sm:table-cell sm:max-w-0 sm:py-2.5',
                        tie ? 'pl-11' : 'pl-4',
                      )}
                    >
                      {tie && (
                        // The branch, drawn rather than spelled: one rule down the left of the
                        // worktrees under a checkout, stopping at the last of them, and a tick
                        // across to each name. A glyph per row would leave the rule in pieces,
                        // since a row is two lines tall and a character is one.
                        <>
                          <span
                            aria-hidden
                            className={cx(
                              'absolute top-0 left-6 w-px bg-line',
                              // A pixel past the cell, or the row's own border cuts the rule.
                              last ? 'h-[19px]' : '-bottom-px',
                            )}
                          />
                          <span
                            aria-hidden
                            className="absolute top-[19px] left-6 h-px w-3 bg-line"
                          />
                        </>
                      )}
                      <span className="flex min-w-0 items-baseline gap-2">
                        <Link
                          to={projectPath(home, project.slug)}
                          // `flex-1` gives it a basis of zero, so it takes what is left rather
                          // than its own content width; without it the badge beside a long name
                          // is pushed past the edge of a narrow screen.
                          className="min-w-0 flex-1 truncate font-medium"
                        >
                          {project.label}
                        </Link>
                        {tie && project.isWorktree && <Badge>{t.ui.worktree}</Badge>}
                        {project.isTransient && <Badge>{t.projects.temporary}</Badge>}
                      </span>
                      <span className="block truncate">
                        <Mono>
                          <Muted>{project.cwd ?? project.slug}</Muted>
                        </Mono>
                      </span>
                    </td>
                    <Figure label={t.projects.columns.sessions}>{project.sessions}</Figure>
                    <Figure label={t.projects.columns.memory}>
                      {project.memoryFiles > 0 ? project.memoryFiles : <Muted>—</Muted>}
                    </Figure>
                    <Figure label={t.projects.columns.transcripts}>
                      <Muted>{bytes(project.bytes)}</Muted>
                    </Figure>
                    <Figure label={t.projects.columns.lastActive} last>
                      <Muted>{when(project.lastActive)}</Muted>
                    </Figure>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {shown.length === 0 && (
            <p className="px-4 py-8 text-center text-muted">
              {t.projects.nothingMatches(needle ? query.trim() : null)}
            </p>
          )}
        </Panel>
      </Rise>

      {transient > 0 && !showTransient && (
        <Rise index={4}>
          <p className="mt-3 max-w-2xl text-muted">{t.projects.hiddenNote(transient)}</p>
        </Rise>
      )}
    </>
  )
}
