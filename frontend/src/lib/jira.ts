import type { Stage } from '@/types/api'

export const JIRA_PROJECT_KEY = 'GEIST'
export const JIRA_PROJECT_NAME = 'Geistesblitz Delivery'
export const JIRA_BASE = 'geistesblitz.atlassian.net'

export function ideaRef(reference: number | null | undefined): string {
  return reference == null ? '' : `${JIRA_PROJECT_KEY}-${reference}`
}

export function jiraPath(id: string): string {
  return `/jira/${id}`
}

export type JiraStatus = { label: string; tone: 'todo' | 'progress' | 'done' }

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

export function jiraStoryPoints(opts: { netVotes: number; sponsorBoost: boolean }): number {
  const fib = [1, 2, 3, 5, 8, 13]
  const weight = opts.netVotes + (opts.sponsorBoost ? 8 : 0)
  const idx = Math.min(fib.length - 1, Math.max(0, Math.round(weight / 6)))
  return fib[idx]
}

export function jiraSprint(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 17) + id.charCodeAt(i)) | 0
  return 18 + (Math.abs(h) % 6)
}
