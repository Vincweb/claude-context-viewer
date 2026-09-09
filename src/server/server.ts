import http from 'http'
import path from 'path'
import { readProjectExtras } from './extras'
import { readLinkedFile } from './files'
import { checkHome, discoverHomes } from './homes'
import { defaultHome, resolveHome } from './paths'
import { watchProjects } from './watch'
import {
  projectCwd,
  readInstructions,
  readProjectMemory,
  readSession,
  readSessions,
  scanProjects,
} from './scan'
import { DEV_CLIENT, MISSING_CLIENT, clientIsBuilt, devPage, serveClientFile } from './static'

const json = (response: http.ServerResponse, payload: unknown, status = 200) => {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  response.end(JSON.stringify(payload))
}

/**
 * Whether a request comes from somewhere other than the page itself. Browsers say where in
 * `Sec-Fetch-Site`; `none` is a URL typed by hand, and a request without the header is not a page
 * acting on someone else's behalf — curl, or a browser too old to tell us.
 *
 * It matters more here than in most local tools: these routes hand out transcripts, which hold
 * whatever was said and pasted into a session.
 */
const isForeign = (request: http.IncomingMessage) => {
  const site = request.headers['sec-fetch-site']
  return typeof site === 'string' && site !== 'same-origin' && site !== 'none'
}

/** The routes that read one Claude folder, and therefore need `?home=` to resolve. */
const HOME_ROUTES = [
  '/api/projects',
  '/api/project',
  '/api/instructions',
  '/api/session',
  '/api/file',
  '/api/extras',
  '/api/watch',
]

export const serveContextViewer = ({
  port,
  host = '127.0.0.1',
  version = '',
}: {
  port: number
  host?: string
  version?: string
}) => {
  const built = clientIsBuilt()
  // Set by `pnpm dev`: the page then lives on the Vite dev server, not in dist/client.
  const devWeb = process.env.CLAUDE_CONTEXT_DEV
    ? (process.env.CLAUDE_CONTEXT_WEB ?? 'http://localhost:4701')
    : null

  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    try {
      if (url.pathname.startsWith('/api/')) {
        if (isForeign(request)) {
          json(response, { error: 'these transcripts are only served to the page itself' }, 403)
          return
        }

        if (url.pathname === '/api/homes') {
          json(response, { default: defaultHome(), candidates: discoverHomes(), version })
          return
        }

        if (url.pathname === '/api/home') {
          const result = checkHome(url.searchParams.get('path') ?? '')
          if ('error' in result) json(response, result, 400)
          else json(response, result.home)
          return
        }

        if (!HOME_ROUTES.includes(url.pathname)) {
          // Named, so a page talking to an older server says which route that server is missing
          // rather than a bare "not found".
          json(response, { error: `no such API route: ${url.pathname}` }, 404)
          return
        }

        const home = resolveHome(url.searchParams.get('home'))
        if (!home) {
          json(
            response,
            { error: 'no Claude folder there — expected one holding a projects/ directory' },
            400,
          )
          return
        }
        const slug = url.searchParams.get('slug') ?? ''

        if (url.pathname === '/api/projects') {
          json(response, { home, version, projects: scanProjects(home) })
          return
        }

        if (url.pathname === '/api/project') {
          const sessions = readSessions(home, slug)
          const memory = readProjectMemory(home, slug)
          if (!sessions || !memory) {
            json(response, { error: `no project folder named ${slug}` }, 404)
            return
          }
          const project = scanProjects(home).find((candidate) => candidate.slug === slug)
          json(response, { project, sessions, memory })
          return
        }

        if (url.pathname === '/api/instructions') {
          const payload = readInstructions(home, slug)
          if (!payload) {
            json(response, { error: `no project folder named ${slug}` }, 404)
            return
          }
          json(response, payload)
          return
        }

        if (url.pathname === '/api/watch') {
          // An event stream rather than a poll: a scan opens the head and the tail of every
          // transcript on disk, and asking for one every few seconds to be told nothing changed
          // is the wrong shape for a page that sits open all day.
          response.writeHead(200, {
            'content-type': 'text/event-stream; charset=utf-8',
            'cache-control': 'no-store',
            connection: 'keep-alive',
            'x-accel-buffering': 'no',
          })
          const send = (slugs: string[]) => response.write(`data: ${JSON.stringify({ slugs })}\n\n`)
          const stop = watchProjects(home, send)
          if (!stop) {
            // Say so in the stream rather than failing: the page shows that it is not watching.
            response.write('event: unavailable\ndata: {}\n\n')
            response.end()
            return
          }
          response.write(': watching\n\n')
          // A comment on a timer, so an idle stream is not mistaken for a dead one.
          const ping = setInterval(() => response.write(': ping\n\n'), 30_000)
          ping.unref()
          request.on('close', () => {
            clearInterval(ping)
            stop()
          })
          return
        }

        if (url.pathname === '/api/extras') {
          const payload = readProjectExtras(home, slug)
          if (!payload) {
            json(response, { error: `no project folder named ${slug}` }, 404)
            return
          }
          json(response, payload)
          return
        }

        if (url.pathname === '/api/file') {
          // Two roots, and no more: the repository these sessions ran in, and the Claude folder
          // itself — which is where the memory files and the machine-wide CLAUDE.md live.
          const cwd = projectCwd(home, slug)
          const result = readLinkedFile({
            from: url.searchParams.get('from') ?? '',
            href: url.searchParams.get('href') ?? '',
            roots: [home, ...(cwd ? [cwd] : [])],
          })
          if ('error' in result) json(response, result, 403)
          else json(response, result)
          return
        }

        const payload = readSession(home, slug, url.searchParams.get('id') ?? '')
        if (!payload) {
          json(response, { error: 'no such session' }, 404)
          return
        }
        json(response, payload)
        return
      }

      if (devWeb) {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
        // The same route, on the server that has the page: a deep link keeps working.
        response.end(devPage(`${devWeb}${url.pathname}${url.search}`))
        return
      }
      if (!built) {
        response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
        response.end(MISSING_CLIENT)
        return
      }
      if (serveClientFile(url.pathname, response)) return
      // A path naming a file has to miss rather than fall back to the entry HTML: a browser
      // holding a stale asset URL must see the 404, not an HTML page it cannot parse as a module.
      if (path.extname(url.pathname)) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
        response.end(`${url.pathname} is not in this build — reload the page.\n`)
        return
      }
      serveClientFile('/', response)
    } catch (error) {
      console.error(error)
      json(response, { error: error instanceof Error ? error.message : 'unexpected error' }, 500)
    }
  })

  server.on('error', (error) => {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
      console.error(`✗ port ${port} is already in use — pass --port <n> to pick another`)
      process.exit(1)
    }
    throw error
  })

  server.listen(port, host, () => {
    if (!built) console.warn(process.env.CLAUDE_CONTEXT_DEV ? DEV_CLIENT : MISSING_CLIENT)
    console.log(`claude-context-viewer → ${devWeb ?? `http://${host}:${port}`}`)
    console.log(`Default folder ${defaultHome()}; pick another in the page. Ctrl-C to stop.`)
  })

  const shutdown = () => {
    server.close(() => process.exit(0))
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  return server
}
