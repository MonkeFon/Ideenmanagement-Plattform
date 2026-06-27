import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { IdeaApi } from '@/api/endpoints'
import { PageSpinner } from '@/components/Spinner'
import {
  JIRA_BASE, JIRA_PROJECT_NAME, ideaRef, jiraSprint, jiraStatus, jiraStoryPoints,
} from '@/lib/jira'
import { ArrowLeft, Bookmark, Check, ChevronDown, MessageSquare } from 'lucide-react'

/**
 * Mock "Jira" issue view. Implemented ideas (IN_IMPLEMENTATION / DONE) link here to
 * simulate the hand-off into a delivery tool. There is no real Jira instance — this
 * page renders an Atlassian-styled issue out of the idea's own data so the demo can
 * show the round-trip without leaving the app. Colours are hard-coded to Jira's brand
 * (not the app theme) on purpose, so it reads as a separate system.
 */

const STATUS_LOZENGE: Record<string, { bg: string; fg: string }> = {
  todo:     { bg: '#DFE1E6', fg: '#42526E' },
  progress: { bg: '#DEEBFF', fg: '#0747A6' },
  done:     { bg: '#E3FCEF', fg: '#006644' },
}

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
  return (
    <span
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {initials || '?'}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-2 py-2">
      <div className="text-[12px] font-medium text-[#5E6C84]">{label}</div>
      <div className="text-[13px] text-[#172B4D]">{children}</div>
    </div>
  )
}

export default function MockJira() {
  const { id = '' } = useParams()
  const ideaQ = useQuery({ queryKey: ['idea', id], queryFn: () => IdeaApi.get(id) })
  const commentsQ = useQuery({ queryKey: ['idea', id, 'comments'], queryFn: () => IdeaApi.listComments(id) })

  if (ideaQ.isLoading || !ideaQ.data) return <div className="min-h-screen bg-white"><PageSpinner /></div>
  const idea = ideaQ.data
  const key = ideaRef(idea.reference)
  const status = jiraStatus(idea.stage)
  const lozenge = STATUS_LOZENGE[status.tone]
  const points = jiraStoryPoints({ netVotes: idea.netVotes, sponsorBoost: idea.sponsorBoost })
  const sprint = jiraSprint(idea.id)
  const labels = [idea.category, idea.campaignName].filter(Boolean) as string[]
  const fmt = (d: string) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-white text-[#172B4D]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Top navigation — Jira wordmark + project switcher */}
      <header className="flex h-12 items-center gap-3 border-b border-[#DFE1E6] px-4">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden>
            <path fill="#2684FF" d="M30 16L17 3a1 1 0 00-1.4 0L3 16l6.5 6.5L16 16l6.5 6.5L30 16z" opacity="0.85" />
            <path fill="#0052CC" d="M16 16l-6.5 6.5L16 29l6.5-6.5L16 16z" />
          </svg>
          <span className="text-[15px] font-semibold tracking-tight text-[#42526E]">Jira</span>
        </div>
        <span className="text-[#DFE1E6]">|</span>
        <span className="text-[13px] font-medium text-[#42526E]">{JIRA_PROJECT_NAME}</span>
        <span className="ml-auto text-[12px] text-[#6B778C]">{JIRA_BASE}</span>
      </header>

      {/* Demo banner — make the mock unmistakable */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-[#FFE380] bg-[#FFFAE6] px-4 py-2 text-[12px] text-[#172B4D]">
        <span className="font-semibold">Demo-Mock:</span>
        <span>Simulierte Jira-Ansicht — der Vorgang wird aus der Geistesblitz-Idee erzeugt.</span>
        <Link to={`/ideas/${idea.id}`} className="ml-auto inline-flex items-center gap-1 font-medium text-[#0052CC] hover:underline">
          <ArrowLeft size={13} strokeWidth={2} /> Zurück zur Plattform
        </Link>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[12px] text-[#6B778C]">
          <span>{JIRA_PROJECT_NAME}</span>
          <span>/</span>
          <span className="inline-flex items-center gap-1 font-medium text-[#42526E]">
            <Check size={12} className="rounded-sm bg-[#0052CC] p-[1px] text-white" strokeWidth={3} />
            {key}
          </span>
        </div>

        <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Main column */}
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold leading-snug text-[#172B4D]">{idea.title}</h1>

            <div className="mt-4">
              <div className="text-[12px] font-semibold text-[#5E6C84]">Beschreibung</div>
              <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-relaxed text-[#172B4D]">{idea.description}</p>
            </div>

            {/* Activity / comments */}
            <div className="mt-7">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#172B4D]">
                <MessageSquare size={14} strokeWidth={2} /> Aktivität
                <span className="ml-1 text-[12px] font-normal text-[#6B778C]">{commentsQ.data?.length ?? 0} Kommentare</span>
              </div>
              <div className="mt-3 space-y-4">
                {(commentsQ.data?.length ?? 0) === 0 && (
                  <div className="text-[13px] text-[#6B778C]">Noch keine Kommentare auf dem Vorgang.</div>
                )}
                {commentsQ.data?.map((c) => (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar name={c.userName} color="#6554C0" />
                    <div className="min-w-0">
                      <div className="text-[13px]">
                        <span className="font-semibold text-[#172B4D]">{c.userName}</span>{' '}
                        <span className="text-[12px] text-[#6B778C]">{new Date(c.createdAt).toLocaleString('de-DE')}</span>
                      </div>
                      <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#172B4D]">{c.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Details side panel */}
          <aside>
            <button
              type="button"
              className="mb-3 inline-flex w-full items-center justify-between rounded border border-[#DFE1E6] px-3 py-1.5 text-[13px] font-medium text-[#42526E]"
              disabled
            >
              <span className="inline-flex items-center gap-1.5"><Bookmark size={13} /> Story</span>
              <ChevronDown size={14} className="text-[#6B778C]" />
            </button>

            <div className="rounded-lg border border-[#DFE1E6]">
              <div className="border-b border-[#DFE1E6] px-3 py-2 text-[12px] font-semibold text-[#5E6C84]">Details</div>
              <div className="divide-y divide-[#F4F5F7] px-3">
                <Field label="Status">
                  <span
                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                    style={{ backgroundColor: lozenge.bg, color: lozenge.fg }}
                  >
                    {status.label}
                  </span>
                </Field>
                <Field label="Bearbeiter">
                  <span className="inline-flex items-center gap-1.5"><Avatar name="Delivery Team" color="#00875A" /> Delivery-Team</span>
                </Field>
                <Field label="Reporter">
                  <span className="inline-flex items-center gap-1.5"><Avatar name={idea.authorName} color="#0052CC" /> {idea.authorName}</span>
                </Field>
                <Field label="Priorität">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: idea.sponsorBoost ? '#DE350B' : '#FFAB00' }}
                      aria-hidden
                    />
                    {idea.sponsorBoost ? 'Hoch' : 'Mittel'}
                  </span>
                </Field>
                <Field label="Story Points">
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#DFE1E6] px-1.5 text-[11px] font-semibold text-[#42526E]">{points}</span>
                </Field>
                <Field label="Sprint">Sprint {sprint}</Field>
                <Field label="Labels">
                  {labels.length === 0 ? (
                    <span className="text-[#6B778C]">Keine</span>
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {labels.map((l) => (
                        <span key={l} className="rounded bg-[#EBECF0] px-1.5 py-0.5 text-[11px] font-medium text-[#42526E]">{l}</span>
                      ))}
                    </span>
                  )}
                </Field>
                <Field label="Erstellt">{fmt(idea.createdAt)}</Field>
                <Field label="Aktualisiert">{fmt(idea.submittedAt ?? idea.createdAt)}</Field>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
