import { useState } from 'react'
import type { MemoryReport, ProjectSummary } from '../../shared/types'
import { projectsPath, sessionPath } from '../../shared/routes'
import { cx } from '../cx'
import { buildDeletePrompt, deleteContext } from '../deletePrompt'
import { bytes, truncate, useWhen } from '../format'
import { useT } from '../i18n'
import { useProject } from '../queries'
import { ExtrasPanel } from './ExtrasPanel'
import { InstructionsPanel } from './InstructionsPanel'
import { MemoryPanel } from './MemoryPanel'
import { Modal } from './Modal'
import { PromptBlock } from './PromptBlock'
import {
  BackLink,
  Badge,
  Button,
  Eyebrow,
  Failed,
  Link,
  Loading,
  Mono,
  Muted,
  Panel,
  Rise,
  Stat,
} from './ui'

/**
 * Removing a project folder, as a prompt. The page does not delete: a server on this machine able
 * to remove a directory of transcripts and memories is a surface this tool has no need for, and
 * neither is recoverable. So the folder is described down to what it holds, what it is *not* is
 * said plainly — the repository lives elsewhere and is untouched — and the prompt asks for the
 * listing before anything goes.
 */
const RemoveDialog = ({
  project,
  memory,
  folder,
  open,
  onClose,
}: {
  project: ProjectSummary | undefined
  memory: MemoryReport
  folder: string
  open: boolean
  onClose: () => void
}) => {
  const t = useT()
  const context = deleteContext({ project, memory, folder, size: bytes(project?.bytes ?? 0) })
  const prompt = buildDeletePrompt(context, t)

  return (
    <Modal open={open} onClose={onClose} title={t.remove.title}>
      <p className="text-muted">{t.remove.intro}</p>

      <div className="mt-5">
        <Eyebrow>{t.remove.what}</Eyebrow>
        <p className="text-muted">{t.remove.whatText}</p>
      </div>

      <div className="mt-5">
        <Eyebrow>{t.remove.goes}</Eyebrow>
        <p>
          <Mono className="break-all">{folder}</Mono>
        </p>
        <ul className="mt-2 space-y-1.5">
          {[
            context.sessions > 0
              ? t.remove.transcripts(context.sessions, context.size)
              : t.remove.noTranscripts,
            context.memoryFiles > 0
              ? t.remove.memoryWarning(context.memoryFiles)
              : context.memoryElsewhere
                ? t.remove.memoryElsewhere(context.memoryElsewhere)
                : t.remove.memoryNone,
            context.cwd && context.cwdExists
              ? t.remove.cwdHere(context.cwd)
              : context.cwd
                ? t.remove.cwdGone
                : null,
          ]
            .filter((line): line is string => !!line)
            .map((line, index) => (
              <li key={index} className="flex gap-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-clay" aria-hidden />
                <span className={index === 1 && context.memoryFiles > 0 ? '' : 'text-muted'}>
                  {line}
                </span>
              </li>
            ))}
        </ul>
      </div>

      <p className="mt-5">{t.remove.steps}</p>

      <div className="mt-2">
        <PromptBlock
          label={t.remove.promptLabel}
          text={prompt}
          copy={t.remove.copy}
          copied={t.remove.copied}
          rows={12}
        />
      </div>
    </Modal>
  )
}

const TABS = ['instructions', 'memory', 'sessions', 'files'] as const

export const ProjectView = ({ home, slug }: { home: string; slug: string }) => {
  const t = useT()
  const when = useWhen()
  const { data, error, isPending } = useProject(home, slug)
  const [tab, setTab] = useState<(typeof TABS)[number]>('instructions')
  const [removing, setRemoving] = useState(false)

  if (isPending) return <Loading what={t.project.loading} />
  if (error) return <Failed error={error} />

  return (
    <>
      <Rise>
        <section className="mb-5 flex flex-wrap items-start gap-3">
          <span className="mt-1.5">
            <BackLink to={projectsPath(home)} label={t.ui.backToProjects} />
          </span>
          <div className="min-w-0 flex-1 basis-56">
            <h1 className="flex flex-wrap items-baseline gap-2 font-serif text-[26px] leading-tight tracking-tight">
              {data.project?.label ?? slug}
              {data.project?.isWorktree && <Badge>{t.ui.worktree}</Badge>}
            </h1>
            <p className="mt-1">
              <Mono className="[overflow-wrap:anywhere]">
                <Muted>{data.project?.cwd ?? slug}</Muted>
              </Mono>
            </p>
          </div>
          <Button onClick={() => setRemoving(true)} className="mt-1 shrink-0">
            {t.remove.button}
          </Button>
          <RemoveDialog
            project={data.project}
            memory={data.memory}
            folder={`${home}/projects/${slug}`}
            open={removing}
            onClose={() => setRemoving(false)}
          />
        </section>
      </Rise>

      <Rise index={1}>
        <Panel className="mb-6 flex flex-wrap gap-x-10 gap-y-4 p-5">
          <Stat value={data.sessions.length} label={t.project.sessionsRecorded} />
          <Stat value={data.memory.files.length} label={t.project.memoryFiles} />
          <Stat
            value={data.memory.index ? data.memory.index.entries : '—'}
            label={t.project.linesInIndex}
          />
          <Stat
            value={data.memory.issues.length}
            label={data.memory.issues.length === 1 ? t.project.thingToFix : t.project.thingsToFix}
          />
        </Panel>
      </Rise>

      <Rise index={2}>
        <div className="mb-4 flex flex-wrap gap-1">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={cx(
                'rounded-lg border px-3 py-1.5 transition-colors',
                tab === name
                  ? 'border-line bg-panel font-medium shadow-card'
                  : 'border-transparent text-muted hover:bg-panel',
              )}
            >
              {t.project.tabs[name]}
              {(name === 'memory' || name === 'sessions') && (
                <span className="ml-1.5 tabular-nums opacity-60">
                  {name === 'memory' ? data.memory.files.length : data.sessions.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </Rise>

      <Rise index={3} key={tab}>
        {tab === 'instructions' && (
          <InstructionsPanel home={home} slug={slug} active={tab === 'instructions'} />
        )}
        {tab === 'memory' && <MemoryPanel memory={data.memory} cwd={data.project?.cwd ?? null} />}
        {tab === 'files' && <ExtrasPanel home={home} slug={slug} active={tab === 'files'} />}
        {tab === 'sessions' && (
          <div className="space-y-5">
            <Panel className="p-5">
              <Eyebrow>{t.project.sessionsHow}</Eyebrow>
              <p className="max-w-3xl text-muted">{t.project.sessionsWhat}</p>
              <p className="mt-2 max-w-3xl">
                <Muted>{t.project.sessionsSpan}</Muted>
              </p>
            </Panel>
            <Panel className="overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-line text-left text-faint">
                    <th className="w-[52%] px-3 py-2 font-medium">{t.project.columns.session}</th>
                    <th className="px-3 py-2 font-medium">{t.project.columns.branch}</th>
                    <th className="px-3 py-2 font-medium">{t.project.columns.cli}</th>
                    <th className="px-3 py-2 font-medium">{t.project.columns.size}</th>
                    <th className="px-3 py-2 font-medium">{t.project.columns.lastActive}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sessions.map((session) => (
                    <tr
                      key={session.id}
                      className="border-b border-line last:border-0 hover:bg-code-bg"
                    >
                      <td className="max-w-0 px-3 py-2">
                        <span className="block truncate">
                          <Link to={sessionPath(home, slug, session.id)}>
                            {session.title ?? truncate(session.firstPrompt ?? session.id, 90)}
                          </Link>
                        </span>
                        <div className="truncate">
                          <Mono>
                            <Muted>{session.id}</Muted>
                          </Mono>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Mono>
                          <Muted>{session.gitBranch ?? '—'}</Muted>
                        </Mono>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Muted>{session.cliVersion ?? '—'}</Muted>
                      </td>
                      <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                        <Muted>{bytes(session.bytes)}</Muted>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Muted>{when(session.lastActive)}</Muted>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        )}
      </Rise>
    </>
  )
}
