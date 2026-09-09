/**
 * The URLs the page uses, shared so the server can print one and the client can read it back.
 *
 * Which Claude folder is shown lives in the URL rather than in the server, so a link to a project
 * can be reloaded, bookmarked and shared, and two tabs can hold two folders at once.
 */

/** The picker: the Claude folders found on this machine, and a field to name another. */
export const WELCOME_PATH = '/'

/** Every project folder under one Claude folder. The folder itself comes from `?home=`. */
export const PROJECTS_PATH = '/projects'

/** One project: its instructions, auto-memory and sessions. `?home=` and `?slug=`. */
export const PROJECT_PATH = '/project'

/** One session's injected layers. `?home=`, `?slug=` and `?id=`. */
export const SESSION_PATH = '/session'

/**
 * A folder as a query value. Slashes are left alone — they are legal in a query, and a path is
 * easier to read than its escapes, in the address bar as much as in the terminal.
 */
const homeQuery = (home: string) => `home=${encodeURIComponent(home).replace(/%2F/g, '/')}`

export const projectsPath = (home: string) => `${PROJECTS_PATH}?${homeQuery(home)}`

export const projectPath = (home: string, slug: string) =>
  `${PROJECT_PATH}?${homeQuery(home)}&slug=${encodeURIComponent(slug)}`

export const sessionPath = (home: string, slug: string, id: string) =>
  `${SESSION_PATH}?${homeQuery(home)}&slug=${encodeURIComponent(slug)}&id=${encodeURIComponent(id)}`
