import net from 'net'

/** The name a `Host` header carries, without its port or the brackets around an IPv6 literal. */
const hostnameOf = (header: string) =>
  (header.startsWith('[') ? header.slice(1, header.indexOf(']')) : header.replace(/:\d*$/, ''))
    .toLowerCase()
    .replace(/\.$/, '')

/**
 * Whether a request was addressed to a name this server answers to.
 *
 * `Sec-Fetch-Site` cannot see DNS rebinding: a page on evil.example whose name is then pointed at
 * 127.0.0.1 is same-origin with this server as far as the browser can tell, and would be handed
 * the transcripts. What that page cannot change is the name it asked for, which arrives as `Host`.
 * So only names nobody else can repoint get through: an IP literal, `localhost` and anything under
 * it, and whatever name was given to --host by hand.
 */
export const isAllowedHost = (header: string | undefined, bound: string) => {
  // A browser always sends one, so a request without it is not a page acting on anyone's behalf.
  if (!header) return true
  const name = hostnameOf(header)
  return (
    net.isIP(name) !== 0 ||
    name === 'localhost' ||
    name.endsWith('.localhost') ||
    name === hostnameOf(bound)
  )
}
