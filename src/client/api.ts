import type {
  ExtrasPayload,
  HomeCandidate,
  HomesPayload,
  InstructionsPayload,
  LinkedFile,
  ProjectPayload,
  ProjectsPayload,
  SessionPayload,
} from '../shared/types'

/** What the server says went wrong, when it is the one answering. */
const errorIn = (payload: unknown) =>
  typeof payload === 'object' && payload !== null && 'error' in payload
    ? String(payload.error)
    : null

const get = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) throw new Error(errorIn(payload) ?? `request failed (${response.status})`)
  return payload as T
}

const query = (params: Record<string, string>) =>
  Object.entries(params)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')

export const fetchHomes = () => get<HomesPayload>('/api/homes')

export const checkHome = (path: string) => get<HomeCandidate>(`/api/home?${query({ path })}`)

export const fetchProjects = (home: string) =>
  get<ProjectsPayload>(`/api/projects?${query({ home })}`)

export const fetchProject = (home: string, slug: string) =>
  get<ProjectPayload>(`/api/project?${query({ home, slug })}`)

export const fetchInstructions = (home: string, slug: string) =>
  get<InstructionsPayload>(`/api/instructions?${query({ home, slug })}`)

/** Everything in a project folder that is neither a session transcript nor a memory file. */
export const fetchExtras = (home: string, slug: string) =>
  get<ExtrasPayload>(`/api/extras?${query({ home, slug })}`)

/** Where a relative link in a rendered file leads. `from` is the file the link was written in. */
export const fetchLinkedFile = (home: string, slug: string, from: string, href: string) =>
  get<LinkedFile>(`/api/file?${query({ home, slug, from, href })}`)

export const fetchSession = (home: string, slug: string, id: string) =>
  get<SessionPayload>(`/api/session?${query({ home, slug, id })}`)
