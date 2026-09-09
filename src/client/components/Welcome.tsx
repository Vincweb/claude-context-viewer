import { useState, type ReactNode } from 'react'
import { projectsPath } from '../../shared/routes'
import { useWhen } from '../format'
import { useT } from '../i18n'
import { navigate } from '../router'
import { useCheckHome, useHomes } from '../queries'
import { AssemblyDiagram } from './AssemblyDiagram'
import { ContextDiagram } from './ContextDiagram'
import { Logo } from './Logo'
import { StackDiagram } from './StackDiagram'
import { TokenDiagram } from './TokenDiagram'
import { Badge, Button, Eyebrow, Failed, Link, Loading, Mono, Muted, Panel, Rise } from './ui'

const PathField = () => {
  const t = useT()
  const [value, setValue] = useState('')
  const check = useCheckHome()

  return (
    <form
      className="mt-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!value.trim()) return
        check.mutate(value, { onSuccess: (home) => navigate(projectsPath(home.path)) })
      }}
    >
      <label htmlFor="home-path" className="block text-muted">
        {t.welcome.orName}
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="home-path"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t.welcome.placeholder}
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-line bg-panel px-3 py-1.5 font-mono text-[12px] outline-none transition-colors placeholder:text-faint focus:border-accent"
        />
        <Button type="submit" primary disabled={check.isPending || !value.trim()}>
          {check.isPending ? t.welcome.checking : t.welcome.open}
        </Button>
      </div>
      {check.error && (
        <p className="mt-2 text-muted">
          {check.error instanceof Error ? check.error.message : t.welcome.refused}
        </p>
      )}
    </form>
  )
}

/**
 * The picker. Nothing is chosen for the visitor: the default folder is offered first and most
 * prominently, and a second profile — `CLAUDE_CONFIG_DIR`, a `~/.claude-*` sibling — beside it.
 */
const Picker = () => {
  const t = useT()
  const when = useWhen()
  const { data, error, isPending } = useHomes()

  return (
    <Rise index={2}>
      <Eyebrow>{t.welcome.chooseFolder}</Eyebrow>
      {isPending && <Loading what={t.welcome.loadingHomes} />}
      {error && <Failed error={error} />}
      {data && (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.candidates.map((candidate, index) => (
            <Rise key={candidate.path} index={index + 3}>
              <Link to={projectsPath(candidate.path)} className="block !text-text no-underline">
                <Panel className="lift h-full p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <Mono className="truncate font-medium">{candidate.label}</Mono>
                    {candidate.isDefault && <Badge tone="accent">{t.welcome.default}</Badge>}
                  </div>
                  <p className="mt-3 text-[22px] leading-tight font-semibold tabular-nums tracking-tight">
                    {candidate.projects}
                    <span className="ml-1.5 text-[13px] font-normal text-muted">
                      {t.welcome.projectFolders}
                    </span>
                  </p>
                  <p className="mt-1">
                    <Muted>
                      {t.welcome.withMemory(candidate.memoryFolders, when(candidate.lastActive))}
                    </Muted>
                  </p>
                </Panel>
              </Link>
            </Rise>
          ))}
        </div>
      )}
      <PathField />
      <p className="mt-5 max-w-xl">
        <Muted>{t.welcome.privacy}</Muted>
      </p>
    </Rise>
  )
}

/** One of the three lessons: a number, a serif title, a paragraph, and the drawing. */
const Lesson = ({
  number,
  title,
  children,
  figure,
  flip = false,
  wide = false,
}: {
  number: string
  title: string
  children: ReactNode
  figure: ReactNode
  flip?: boolean
  wide?: boolean
}) => (
  <Rise>
    <section
      className={
        wide
          ? 'grid gap-6'
          : flip
            ? 'grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:[&>*:first-child]:order-2'
            : 'grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center'
      }
    >
      <div className={wide ? 'min-w-0 max-w-2xl' : 'min-w-0'}>
        <p className="font-mono text-[12px] text-clay">{number}</p>
        <h2 className="mt-1 font-serif text-[24px] leading-tight tracking-tight">{title}</h2>
        <div className="mt-3 space-y-2.5 text-[14px] leading-relaxed text-muted">{children}</div>
      </div>
      <Panel className="min-w-0 p-5">{figure}</Panel>
    </section>
  </Rise>
)

export const Welcome = () => {
  const t = useT()
  return (
    <div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <div>
          <Rise>
            <div className="flex items-center gap-3">
              <Logo size={40} />
              <h1 className="font-serif text-[34px] leading-none tracking-tight">claude-context</h1>
            </div>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">
              {t.welcome.tagline}
            </p>
          </Rise>
          <div className="mt-8">
            <Picker />
          </div>
        </div>

        <Rise index={1}>
          <Panel className="p-5">
            <StackDiagram />
          </Panel>
        </Rise>
      </div>

      <div className="mt-16 border-t border-line pt-10">
        <Rise>
          <Eyebrow>{t.welcome.threeThings}</Eyebrow>
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted">
            {t.welcome.threeThingsIntro}
          </p>
        </Rise>

        <div className="mt-10 space-y-14">
          <Lesson number="01" title={t.welcome.lesson1.title} figure={<AssemblyDiagram />}>
            <p>{t.welcome.lesson1.p1}</p>
            <p>
              {t.welcome.lesson1.p2a}
              <span className="text-text">CLAUDE.md</span>
              {t.welcome.lesson1.p2b}
            </p>
          </Lesson>

          <Lesson number="02" title={t.welcome.lesson2.title} flip figure={<ContextDiagram />}>
            <p>{t.welcome.lesson2.p1}</p>
            <p>{t.welcome.lesson2.p2}</p>
          </Lesson>

          <Lesson number="03" title={t.welcome.lesson3.title} wide figure={<TokenDiagram />}>
            <p>{t.welcome.lesson3.p1}</p>
          </Lesson>
        </div>
      </div>
    </div>
  )
}
