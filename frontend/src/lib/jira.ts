import type { Stage } from '@/types/api'

/** Mock delivery project the implemented ideas are "tracked" in. */
export const JIRA_PROJECT_KEY = 'GEIST'
export const JIRA_PROJECT_NAME = 'Geistesblitz Delivery'
export const JIRA_BASE = 'geistesblitz.atlassian.net'

/**
 * The idea's stable reference key (e.g. GEIST-7), built from its per-tenant sequential
 * `reference` number. This is the idea's own identifier shown across the app, and — for
 * implemented ideas — doubles as the mock Jira ticket key, so an idea and its delivery
 * ticket read as one and the same.
 */
export function ideaRef(reference: number | null | undefined): string {
  return reference == null ? '' : `${JIRA_PROJECT_KEY}-${reference}`
}

/** In-app path to the mock Jira issue view for an idea. */
export function jiraPath(id: string): string {
  return `/jira/${id}`
}

export type JiraStatus = { label: string; tone: 'todo' | 'progress' | 'done' }

/** Maps a workflow stage onto a Jira-style status lozenge (German). */
export function jiraStatus(stage: Stage): JiraStatus {
  switch (stage) {
    case 'DONE':
      return { label: 'Fertig', tone: 'done' }
    case 'IN_IMPLEMENTATION':
      return { label: 'In Arbeit', tone: 'progress' }
    default:
      return { label: 'To Do', tone: 'todo' }
  }
}

/**
 * Synthetic but stable story-point estimate. Sponsor-boosted or hotly-voted ideas
 * land on a higher Fibonacci bucket, so the mock board looks plausibly groomed.
 */
export function jiraStoryPoints(opts: { netVotes: number; sponsorBoost: boolean }): number {
  const fib = [1, 2, 3, 5, 8, 13]
  const weight = opts.netVotes + (opts.sponsorBoost ? 8 : 0)
  const idx = Math.min(fib.length - 1, Math.max(0, Math.round(weight / 6)))
  return fib[idx]
}

/** Deterministic sprint number so the details panel reads like a real board. */
export function jiraSprint(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 17) + id.charCodeAt(i)) | 0
  return 18 + (Math.abs(h) % 6) // Sprint 18..23
}
