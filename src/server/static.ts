import fs from 'fs'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Where `vite build` puts the client. Built, this module sits in `dist/` and the bundle is right
 * next to it; run from source it sits in `src/server/`, and the bundle is still the one in `dist/`.
 */
export const clientDir = fileURLToPath(
  new URL(
    import.meta.url.includes('/src/server/') ? '../../dist/client/' : './client/',
    import.meta.url,
  ),
)

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

export const clientIsBuilt = () => fs.existsSync(path.join(clientDir, 'index.html'))

/**
 * Serves one file from the built client. Returns false when the path resolves outside the
 * bundle or names nothing, so the caller can answer 404 itself.
 */
export const serveClientFile = (pathname: string, response: http.ServerResponse) => {
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  const file = path.resolve(clientDir, relative)
  if (!file.startsWith(clientDir)) return false
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return false

  const extension = path.extname(file)
  response.writeHead(200, {
    'content-type': MIME[extension] ?? 'application/octet-stream',
    // Vite fingerprints everything under /assets, so only the entry HTML must never be cached.
    'cache-control': relative.startsWith('assets/')
      ? 'public, max-age=31536000, immutable'
      : 'no-store',
  })
  response.end(fs.readFileSync(file))
  return true
}

/** `pnpm dev` sets this: the page then comes from Vite, and a missing bundle is expected. */
export const DEV_CLIENT =
  'claude-context-viewer: serving the API only — the page comes from the Vite dev server, on the URL it prints.'

/** The URL is echoed into the page, so it must not be able to close the attribute it sits in. */
const escapeAttribute = (value: string) =>
  value.replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`)

/**
 * What this port answers in dev. Serving `dist/client` here would hand out the last build while
 * you edit the source, so it points at the dev server instead.
 */
export const devPage = (web: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>claude-context-viewer — API server</title>
<style>
  :root { color-scheme: light dark }
  body { margin: 0; display: grid; place-content: center; min-height: 100vh;
         font: 14px/1.6 ui-sans-serif, -apple-system, "Segoe UI", sans-serif; text-align: center }
  code { font-family: ui-monospace, monospace }
  a { font-size: 18px }
</style></head>
<body><div>
  <p>This port serves <code>/api</code> only.</p>
  <p>The page is on the Vite dev server: <a href="${escapeAttribute(web)}">${escapeAttribute(web)}</a></p>
</div></body></html>
`

export const MISSING_CLIENT = `claude-context-viewer: the client bundle is missing from ${clientDir}

Running from source? Build it once with \`pnpm build\`, or use \`pnpm dev\` — which serves
this API and the Vite dev server side by side.
`
