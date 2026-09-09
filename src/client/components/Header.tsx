import { WELCOME_PATH, projectPath, projectsPath } from '../../shared/routes'
import { useT } from '../i18n'
import type { Route } from '../router'
import { Logo } from './Logo'
import { Link } from './ui'

/** `/Users/someone/.claude` reads as `~/.claude`, which is how anyone would say it. */
const shortHome = (home: string) => home.replace(/^\/Users\/[^/]+|^\/home\/[^/]+/, '~')

export const Header = ({ route }: { route: Route }) => {
  const t = useT()
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3">
        <Link
          to={WELCOME_PATH}
          className="flex shrink-0 items-center gap-2 !text-text no-underline"
        >
          <Logo />
          <span className="font-serif text-[16px] tracking-tight whitespace-nowrap">
            claude-context
          </span>
        </Link>

        {route.view !== 'welcome' && route.home && (
          <nav className="flex min-w-0 items-center gap-2 text-muted">
            <span aria-hidden className="text-faint">
              /
            </span>
            <Link to={projectsPath(route.home)} className="truncate font-mono text-[12px]">
              {shortHome(route.home)}
            </Link>
            {route.view === 'session' && (
              <>
                <span aria-hidden className="text-faint">
                  /
                </span>
                <Link to={projectPath(route.home, route.slug)}>{t.header.project}</Link>
              </>
            )}
          </nav>
        )}

        {route.view !== 'welcome' && (
          <Link
            to={WELCOME_PATH}
            className="ml-auto shrink-0 text-[12px] whitespace-nowrap text-muted"
          >
            {t.header.changeFolder}
          </Link>
        )}
      </div>
    </header>
  )
}
