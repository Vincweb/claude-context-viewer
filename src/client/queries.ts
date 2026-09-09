import { useMutation, useQuery } from '@tanstack/react-query'
import {
  checkHome,
  fetchExtras,
  fetchHomes,
  fetchInstructions,
  fetchLinkedFile,
  fetchProject,
  fetchProjects,
  fetchSession,
} from './api'

/**
 * Everything is keyed by the folder it was read from — `home` first — so switching folders never
 * shows the previous one's data while the new one loads, and switching back is instant.
 */
export const useHomes = () => useQuery({ queryKey: ['homes'], queryFn: fetchHomes })

/** The path field: one round trip to learn whether a typed folder is a Claude folder at all. */
export const useCheckHome = () => useMutation({ mutationFn: checkHome })

export const useProjects = (home: string, { enabled = true } = {}) =>
  useQuery({
    queryKey: ['projects', home],
    queryFn: () => fetchProjects(home),
    // Every view shows the folder in its header, so this one is held rather than re-scanned on
    // each navigation — the scan opens the head of every transcript on disk.
    staleTime: 60_000,
    enabled,
  })

export const useProject = (home: string, slug: string) =>
  useQuery({
    queryKey: ['project', home, slug],
    queryFn: () => fetchProject(home, slug),
    enabled: !!slug,
  })

/** The disk walk behind this is the expensive one, so it only runs when the tab is opened. */
export const useInstructions = (home: string, slug: string, enabled: boolean) =>
  useQuery({
    queryKey: ['instructions', home, slug],
    queryFn: () => fetchInstructions(home, slug),
    enabled: enabled && !!slug,
  })

/** The walk of a project folder, so it only runs when that tab is opened. */
export const useExtras = (home: string, slug: string, enabled: boolean) =>
  useQuery({
    queryKey: ['extras', home, slug],
    queryFn: () => fetchExtras(home, slug),
    enabled: enabled && !!slug,
  })

/** One link followed. Held once read: walking back up a chain of files should not re-read them. */
export const useLinkedFile = (home: string, slug: string, from: string, href: string) =>
  useQuery({
    queryKey: ['file', home, slug, from, href],
    queryFn: () => fetchLinkedFile(home, slug, from, href),
    staleTime: 30_000,
    enabled: !!from && !!href,
  })

export const useSession = (home: string, slug: string, id: string) =>
  useQuery({
    queryKey: ['session', home, slug, id],
    queryFn: () => fetchSession(home, slug, id),
    enabled: !!slug && !!id,
  })
