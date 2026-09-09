import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { defineConfig } from 'vite'

/** Where `pnpm dev` reaches the API server. Match it if you start the CLI on another port. */
const API = process.env.CLAUDE_CONTEXT_API ?? 'http://127.0.0.1:4700'

/** Stamped into the page footer, so the version on screen is the one that was built. */
const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as {
  version: string
}

export default defineConfig({
  root: 'src/client',
  plugins: [react(), tailwindcss()],
  define: { __APP_VERSION__: JSON.stringify(version) },
  base: '/',
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 4701,
    // A leading ^ makes this a RegExp, and the trailing slash matters: a plain '/api' key
    // matches by prefix, so the client's own /api.ts module would be proxied away too.
    proxy: { '^/api/': API },
  },
})
