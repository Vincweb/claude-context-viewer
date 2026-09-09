import { useEffect } from 'react'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { ProjectView } from './components/ProjectView'
import { ProjectsView } from './components/ProjectsView'
import { SessionView } from './components/SessionView'
import { Welcome } from './components/Welcome'
import { useT } from './i18n'
import { useRoute } from './router'
import { useWatch } from './watch'

export const App = () => {
  const route = useRoute()
  const t = useT()
  // Opened for whichever folder the URL names, and left open: the picker has none to follow.
  const watch = useWatch(route.home)

  // A project route without a folder cannot mean anything; send it to the picker.
  const view = route.view !== 'welcome' && !route.home ? 'welcome' : route.view

  useEffect(() => {
    document.title = t.titles[view]
  }, [t, view])

  return (
    <div className="flex min-h-full flex-col">
      <Header route={route} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        {view === 'welcome' && <Welcome />}
        {view === 'projects' && <ProjectsView home={route.home} watch={watch} />}
        {view === 'project' && <ProjectView home={route.home} slug={route.slug} />}
        {view === 'session' && <SessionView home={route.home} slug={route.slug} id={route.id} />}
      </main>
      <Footer />
    </div>
  )
}
