import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cx } from '../cx'
import { useT } from '../i18n'
import { useLinkedFile } from '../queries'
import { useRoute } from '../router'
import { Modal } from './Modal'
import { Eyebrow, Failed, Loading, Mono, Muted } from './ui'

const isMarkdown = (path: string) => /\.(md|markdown)$/i.test(path)

/** A URL leaves the machine; anything else is a path on disk and can be followed here. */
const isExternal = (href: string) => /^(https?:|mailto:|tel:|data:)/i.test(href)

/** One link followed: which document it was written in, and what it said. */
type Frame = { from: string; href: string }

const fragmentOf = (href: string) => href.split('#')[1] ?? null

/**
 * A file opened in place. Markdown is rendered — that is what a CLAUDE.md or a memory is written
 * in, and headings and lists are easier to scan than their source — with a switch back to the raw
 * text, because sometimes the question is exactly what is on disk. Anything else is shown as is.
 * Rendering goes through React elements, never raw HTML, so a file cannot script the page.
 *
 * A relative link is a path on disk, not a URL: left as an anchor it would send the browser to
 * `/docs/guides/deployment.md` on this server and lose the page. So those are intercepted and the
 * target is read and shown instead — `onOpenLink` is how a file already inside the dialog hands
 * the next one up, rather than stacking dialogs.
 */
export const FileView = ({
  text,
  path,
  onOpenLink,
}: {
  text: string
  path: string
  onOpenLink?: (href: string) => void
}) => {
  const t = useT()
  const markdown = isMarkdown(path)
  const [rendered, setRendered] = useState(markdown)
  const [frames, setFrames] = useState<Frame[]>([])

  const follow = onOpenLink ?? ((href: string) => setFrames([{ from: path, href }]))

  return (
    <div className="bg-code-bg">
      {markdown && (
        <div className="flex justify-end border-b border-line px-3 py-1.5">
          <div
            role="group"
            aria-label={t.viewer.label}
            className="flex rounded-full border border-line bg-panel p-0.5 text-[11px]"
          >
            {(['rendered', 'source'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={rendered === (mode === 'rendered')}
                onClick={() => setRendered(mode === 'rendered')}
                className={cx(
                  'rounded-full px-2.5 py-0.5 font-medium transition-colors',
                  rendered === (mode === 'rendered')
                    ? 'bg-text text-bg'
                    : 'text-muted hover:text-text',
                )}
              >
                {t.viewer[mode]}
              </button>
            ))}
          </div>
        </div>
      )}

      {rendered ? (
        <div className="markdown max-h-[36rem] overflow-auto px-5 py-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, href, children, ...props }) => {
                if (!href) return <span>{children}</span>
                if (isExternal(href))
                  return (
                    <a {...props} href={href} target="_blank" rel="noreferrer">
                      {children}
                    </a>
                  )
                // A bare fragment points inside this same file; there is nothing to open.
                if (href.startsWith('#'))
                  return <span className="text-muted underline decoration-dotted">{children}</span>
                return (
                  <button
                    type="button"
                    onClick={() => follow(href)}
                    title={href}
                    className="cursor-pointer text-accent underline decoration-dotted underline-offset-2 transition-colors hover:text-clay"
                  >
                    {children}
                  </button>
                )
              },
              // No fetching on open: an image URL in someone's CLAUDE.md is shown, not loaded —
              // this page promises that nothing leaves the machine.
              img: ({ alt, src }) => (
                <span className="font-mono text-[12px] text-muted">
                  [{alt || 'image'}: {typeof src === 'string' ? src : ''}]
                </span>
              ),
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      ) : (
        <pre className="max-h-[36rem] overflow-auto px-4 py-3 font-mono text-[12px] whitespace-pre-wrap">
          {text}
        </pre>
      )}

      {frames.length > 0 && (
        <LinkedFileDialog
          frames={frames}
          onPush={(frame) => setFrames([...frames, frame])}
          onBack={() => setFrames(frames.slice(0, -1))}
          onClose={() => setFrames([])}
        />
      )}
    </div>
  )
}

/**
 * The file at the end of a link, and the ones its own links lead to. Only the outermost `FileView`
 * mounts this, so following a chain of files deepens one dialog instead of opening several.
 */
const LinkedFileDialog = ({
  frames,
  onPush,
  onBack,
  onClose,
}: {
  frames: Frame[]
  onPush: (frame: Frame) => void
  onBack: () => void
  onClose: () => void
}) => {
  const t = useT()
  const route = useRoute()
  const top = frames[frames.length - 1] ?? { from: '', href: '' }
  const { data, error, isPending } = useLinkedFile(route.home, route.slug, top.from, top.href)

  const fragment = fragmentOf(top.href)
  const name = (data?.path ?? top.href).split('/').pop() ?? top.href

  return (
    <Modal
      open
      onClose={onClose}
      onBack={frames.length > 1 ? onBack : undefined}
      title={name}
      subtitle={<Mono className="break-all">{data?.path ?? top.href}</Mono>}
    >
      {isPending && <Loading what={t.link.title} />}
      {error && <Failed error={error} />}

      {data && (
        <>
          {fragment && (
            <p className="mb-3">
              <Muted>{t.link.anchor(fragment)}</Muted>
            </p>
          )}

          {data.kind === 'file' && (
            <div className="overflow-hidden rounded-lg border border-line">
              <FileView
                text={data.text}
                path={data.path}
                onOpenLink={(href) => onPush({ from: data.path, href })}
              />
            </div>
          )}

          {data.kind === 'directory' && (
            <>
              <Eyebrow>
                {data.entries.length > 0 ? t.link.directory(data.entries.length) : t.link.empty}
              </Eyebrow>
              <ul className="overflow-hidden rounded-lg border border-line bg-panel">
                {data.entries.map((entry) => (
                  <li key={entry.name} className="border-b border-line last:border-0">
                    <button
                      type="button"
                      onClick={() => onPush({ from: data.path, href: entry.name })}
                      className="flex w-full items-baseline gap-2 px-3 py-1.5 text-left transition-colors hover:bg-code-bg"
                    >
                      <span aria-hidden className="text-faint">
                        {entry.isDirectory ? '▸' : '·'}
                      </span>
                      <Mono className={entry.isDirectory ? 'font-medium' : undefined}>
                        {entry.name}
                        {entry.isDirectory && '/'}
                      </Mono>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {data.kind !== 'file' && data.kind !== 'directory' && (
            <p className="text-muted">{t.link[data.kind]}</p>
          )}
        </>
      )}
    </Modal>
  )
}
