import { cx } from '../cx'
import { LANGS, setLang, useLang, useT, type Lang } from '../i18n'
import { Logo } from './Logo'

const LABEL: Record<Lang, string> = { en: 'EN', fr: 'FR' }

/** The version that was built, the licence, and the one setting the page has: its language. */
export const Footer = () => {
  const t = useT()
  const lang = useLang()
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-5 py-5 text-[12px] text-muted">
        <Logo size={16} />
        <span className="font-serif text-[14px] text-text">claude-context</span>
        <span className="font-mono">v{__APP_VERSION__}</span>
        <span aria-hidden>·</span>
        <span>{t.footer.license}</span>
        <span aria-hidden>·</span>
        <a
          href="https://github.com/Vincweb"
          target="_blank"
          rel="noreferrer"
          className="text-accent transition-colors hover:text-clay"
        >
          {t.footer.author}
        </a>
        <span className="hidden sm:inline" aria-hidden>
          ·
        </span>
        <span className="hidden sm:inline">{t.footer.localOnly}</span>

        <div
          role="group"
          aria-label={t.footer.language}
          className="ml-auto flex rounded-full border border-line bg-panel p-0.5"
        >
          {LANGS.map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={lang === code}
              onClick={() => setLang(code)}
              className={cx(
                'rounded-full px-2.5 py-0.5 font-medium transition-colors',
                lang === code ? 'bg-text text-bg' : 'text-muted hover:text-text',
              )}
            >
              {LABEL[code]}
            </button>
          ))}
        </div>
      </div>
    </footer>
  )
}
