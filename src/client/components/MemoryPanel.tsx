import { useState } from 'react'
import type { MemoryReport } from '../../shared/types'
import { buildFixPrompt } from '../fixPrompt'
import { truncate } from '../format'
import { serverText, useT } from '../i18n'
import { Disclosure } from './Disclosure'
import { FileView } from './FileView'
import { Modal } from './Modal'
import { PromptBlock } from './PromptBlock'
import { Badge, Button, Eyebrow, Mono, Muted, Panel } from './ui'

/**
 * The repair, as a prompt. The page never writes, so the fix is handed to the tool that does:
 * what each problem means, then the exact text to paste into Claude Code, with every file and link
 * named so nothing has to be guessed at.
 */
const FixDialog = ({
  memory,
  cwd,
  open,
  onClose,
}: {
  memory: MemoryReport
  cwd: string | null
  open: boolean
  onClose: () => void
}) => {
  const t = useT()
  const prompt = buildFixPrompt(memory, t)
  const kinds = [...new Set(memory.issues.map((issue) => issue.kind))]

  return (
    <Modal open={open} onClose={onClose} title={t.fix.title}>
      <p className="text-muted">{t.fix.intro}</p>

      <Eyebrow>
        <span className="mt-5 block">{t.fix.how}</span>
      </Eyebrow>
      <ul className="space-y-1.5">
        {kinds.map((kind) => (
          <li key={kind} className="flex gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-clay" aria-hidden />
            <span>
              <span className="font-medium">
                {memory.issues.filter((issue) => issue.kind === kind).length} ×{' '}
              </span>
              <span className="text-muted">{t.fix.kinds[kind]}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-5">{t.fix.steps}</p>
      <pre className="mt-2 rounded-lg border border-line bg-code-bg px-3 py-2 font-mono text-[12px]">
        {cwd ? `cd ${cwd}\nclaude` : 'claude'}
      </pre>

      <div className="mt-5">
        <PromptBlock
          label={t.fix.promptLabel}
          text={prompt}
          copy={t.fix.copy}
          copied={t.fix.copied}
        />
      </div>
    </Modal>
  )
}

export const MemoryPanel = ({ memory, cwd }: { memory: MemoryReport; cwd: string | null }) => {
  const t = useT()
  const [fixing, setFixing] = useState(false)

  if (!memory.root)
    return (
      <Panel className="p-4">
        <p>{t.memory.noFolder}</p>
        <p className="mt-1 text-muted">{t.memory.noFolderHint}</p>
      </Panel>
    )

  return (
    <div className="space-y-4">
      <Panel className="p-5">
        <Eyebrow>{t.memory.folder}</Eyebrow>
        <p>
          <Mono>{memory.root}</Mono>
        </p>
        <p className="mt-2 text-muted tabular-nums">
          {t.memory.summary(memory.files.length, Math.round(memory.chars / 4))}
        </p>
        {memory.index && memory.index.entries > 0 && (
          <p className="mt-1 tabular-nums">
            {t.memory.indexCost(
              Math.round(memory.index.chars / 4),
              memory.index.entries,
              Math.round(memory.index.chars / 4 / memory.index.entries),
            )}
          </p>
        )}
        {memory.sharedWith && (
          <p className="mt-3 text-muted">
            {t.memory.sharedBefore}
            <Mono>{memory.sharedWith}</Mono>
            {t.memory.sharedAfter}
          </p>
        )}
        {memory.index && <p className="mt-3 text-muted">{t.memory.indexExplain}</p>}
      </Panel>

      {memory.issues.length > 0 && (
        <Panel className="overflow-hidden border-warn-line bg-warn-bg">
          <div className="flex items-center justify-between gap-3 border-b border-warn-line px-4 py-2">
            <p className="font-medium">{t.memory.doNotAddUp(memory.issues.length)}</p>
            <Button primary onClick={() => setFixing(true)}>
              {t.fix.button}
            </Button>
          </div>
          <FixDialog memory={memory} cwd={cwd} open={fixing} onClose={() => setFixing(false)} />
          <ul>
            {memory.issues.map((issue, index) => (
              <li key={index} className="border-b border-warn-line px-4 py-2 last:border-0">
                <Mono>{issue.file}</Mono> <Muted>{t.memory.issues[issue.kind]}</Muted>{' '}
                <Mono>{serverText(t.memory.details, issue.detail)}</Mono>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel className="overflow-hidden">
        {memory.files.map((file) => (
          <Disclosure
            key={file.file}
            className="border-b border-line last:border-0"
            summary={() => (
              <span className="flex min-w-0 items-baseline gap-2">
                <Mono className="shrink-0">{file.name ?? file.file}</Mono>
                {file.kind && <Badge>{file.kind}</Badge>}
                <span className="min-w-0 flex-1 truncate">
                  <Muted>{file.description ?? truncate(file.body, 120)}</Muted>
                </span>
                <span className="shrink-0 tabular-nums">
                  <Muted>
                    ≈{Math.round(file.chars / 4)} {t.instructions.tok}
                  </Muted>
                </span>
              </span>
            )}
          >
            {() => <FileView text={file.body} path={`${memory.root ?? ''}/${file.file}`} />}
          </Disclosure>
        ))}
      </Panel>
    </div>
  )
}
