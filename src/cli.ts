#!/usr/bin/env node
import fs from 'fs'
import { fileURLToPath } from 'url'
import { defaultHome } from './server/paths'
import { serveContextViewer } from './server/server'

const DEFAULT_PORT = 4700
const DEFAULT_HOST = '127.0.0.1'

const USAGE = `claude-context-viewer — see every layer Claude Code loads into a session

Usage
  claude-context-viewer [options]
  npx claude-context-viewer

Options
  -p, --port <n>      port to serve on (default: ${DEFAULT_PORT})
      --host <host>   host to bind (default: ${DEFAULT_HOST})
  -h, --help          show this message
  -v, --version       show the version

Opens on a picker offering ${defaultHome()} and any other Claude folder found;
set CLAUDE_CONFIG_DIR to change the default. Nothing is written, and the page is
served to this machine only.
`

const readVersion = () => {
  const manifest = fileURLToPath(new URL('../package.json', import.meta.url))
  const raw: unknown = JSON.parse(fs.readFileSync(manifest, 'utf8'))
  return raw && typeof raw === 'object' && 'version' in raw && typeof raw.version === 'string'
    ? raw.version
    : '0.0.0'
}

const valueOf = (argv: string[], ...names: string[]) => {
  for (const name of names) {
    const index = argv.indexOf(name)
    if (index !== -1) return argv[index + 1]
  }
  return undefined
}

const has = (argv: string[], ...names: string[]) => names.some((name) => argv.includes(name))

export const run = (argv = process.argv.slice(2)): number | null => {
  if (has(argv, '-h', '--help')) {
    console.log(USAGE)
    return 0
  }
  if (has(argv, '-v', '--version')) {
    console.log(readVersion())
    return 0
  }

  const port = Number(valueOf(argv, '-p', '--port') ?? DEFAULT_PORT)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(`✗ invalid port: ${valueOf(argv, '-p', '--port')}`)
    return 1
  }

  serveContextViewer({
    port,
    host: valueOf(argv, '--host') ?? DEFAULT_HOST,
    version: readVersion(),
  })
  return null
}

const code = run()
if (code !== null) process.exit(code)
