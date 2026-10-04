import { spawn } from 'child_process'

/**
 * The URL a browser on this machine reaches the server on. A wildcard bind is not an address to
 * visit, so it becomes loopback; an IPv6 literal needs its brackets.
 */
export const pageUrl = (host: string, port: number) => {
  const reachable = host === '0.0.0.0' ? '127.0.0.1' : host === '::' ? '::1' : host
  return `http://${reachable.includes(':') ? `[${reachable}]` : reachable}:${port}`
}

/**
 * Hands the URL to the system's default browser, with the launcher each platform ships rather than
 * a dependency. Best effort: a machine with no launcher — a CI runner, a server over SSH — still
 * gets the URL printed, so a failure here is swallowed rather than taking the server down.
 */
export const openInBrowser = (url: string) => {
  const [command, args] =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
        ? // `start` reads its first quoted argument as a window title, hence the empty one.
          ['cmd', ['/c', 'start', '""', url]]
        : ['xdg-open', [url]]
  try {
    const child = spawn(command, args, {
      stdio: 'ignore',
      detached: true,
      // Detached, cmd would otherwise flash a console window of its own.
      windowsHide: true,
      // Left unquoted for cmd, which would otherwise read the escaped `""` as the URL.
      windowsVerbatimArguments: process.platform === 'win32',
    })
    child.on('error', () => {})
    child.unref()
  } catch {
    // Nothing to do: the URL is already on the terminal.
  }
}
