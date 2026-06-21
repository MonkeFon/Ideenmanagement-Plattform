import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DevDataApi, type DevColumn, type DevTableData } from '@/api/endpoints'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import Spinner from '@/components/Spinner'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { AlertTriangle, Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight, RefreshCw, KeyRound } from 'lucide-react'

const PAGE = 50

const isLong = (c: DevColumn) => c.udt_name === 'text'
const isBool = (c: DevColumn) => c.udt_name === 'bool'

function display(v: unknown): string {
  if (v === null || v === undefined) return '∅'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  return String(v)
}

type EditorState =
  | { mode: 'new' }
  | { mode: 'edit'; row: Record<string, unknown> }
  | null

export default function DevData() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [editor, setEditor] = useState<EditorState>(null)

  useEffect(() => { document.title = 'Datenkonsole · Geistesblitz' }, [])

  const tablesQ = useQuery({ queryKey: ['dev-tables'], queryFn: () => DevDataApi.tables() })

  useEffect(() => {
    if (!selected && tablesQ.data?.length) setSelected(tablesQ.data[0])
  }, [tablesQ.data, selected])

  const dataQ = useQuery({
    queryKey: ['dev-rows', selected, offset],
    queryFn: () => DevDataApi.rows(selected!, { limit: PAGE, offset }),
    enabled: !!selected,
  })
  const data = dataQ.data

  const refetchRows = () => qc.invalidateQueries({ queryKey: ['dev-rows', selected] })

  const insertM = useMutation({
    mutationFn: (values: Record<string, unknown>) => DevDataApi.insert(selected!, values),
    onSuccess: () => { toast.success('Zeile angelegt'); setEditor(null); refetchRows() },
  })
  const updateM = useMutation({
    mutationFn: (p: { key: Record<string, unknown>; values: Record<string, unknown> }) =>
      DevDataApi.update(selected!, p.key, p.values),
    onSuccess: () => { toast.success('Zeile gespeichert'); setEditor(null); refetchRows() },
  })
  const deleteM = useMutation({
    mutationFn: (key: Record<string, unknown>) => DevDataApi.remove(selected!, key),
    onSuccess: (r) => { toast.success(`Gelöscht (${r.deleted})`); refetchRows() },
  })

  const pk = data?.primaryKey ?? []
  const keyOf = (row: Record<string, unknown>) => Object.fromEntries(pk.map((c) => [c, row[c]]))

  function onDelete(row: Record<string, unknown>) {
    const label = pk.map((c) => `${c}=${display(row[c])}`).join(', ')
    if (!window.confirm(`Diese Zeile endgültig löschen?\n\n${label}`)) return
    deleteM.mutate(keyOf(row))
  }

  const disabled = (tablesQ.error as { response?: { status?: number } })?.response?.status === 404
  const selectTable = (t: string) => { setSelected(t); setOffset(0) }

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-[110rem] mx-auto">
      <header>
        <div className="eyebrow">Entwickler</div>
        <h1 className="mt-1 text-xl font-semibold text-foreground tracking-tight">Datenkonsole</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Direkter Lese-/Schreibzugriff auf die Datenbank. Tabelle wählen, Zeilen bearbeiten, anlegen oder löschen.
        </p>
      </header>

      <div className="flex items-start gap-2.5 rounded border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <AlertTriangle size={15} strokeWidth={2} className="mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold">God-Mode — nur für Demo/Entwicklung.</span> Schreibt direkt in die Datenbank
          und umgeht die Mandantentrennung: Sie sehen und ändern Daten <em>aller</em> Mandanten. Änderungen sind sofort
          wirksam und nicht widerrufbar. Im Produktivbetrieb über <code className="font-mono">ideaplatform.dev.data-console.enabled=false</code> deaktivieren.
        </div>
      </div>

      {disabled && (
        <Card className="p-6 text-[13px] text-muted-foreground">
          Die Datenkonsole ist deaktiviert. Setzen Sie <code className="font-mono">ideaplatform.dev.data-console.enabled=true</code> im Backend und starten Sie es neu.
        </Card>
      )}

      {!disabled && (
        <>
          {/* Table picker */}
          <div className="flex flex-wrap gap-1.5">
            {tablesQ.isLoading && <Spinner size={14} />}
            {tablesQ.data?.map((t) => (
              <button
                key={t}
                onClick={() => selectTable(t)}
                className={cn(
                  'rounded px-2.5 py-1 text-[12px] font-mono border transition-colors',
                  t === selected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {selected && (
            <Card className="overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <span className="font-mono text-[13px] font-medium text-foreground">{selected}</span>
                {data && (
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {data.total === 0 ? '0' : `${offset + 1}–${Math.min(offset + PAGE, data.total)}`} von {data.total}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => refetchRows()} title="Neu laden">
                    <RefreshCw size={14} strokeWidth={1.75} className={dataQ.isFetching ? 'animate-spin' : ''} />
                  </Button>
                  <Button size="sm" onClick={() => setEditor({ mode: 'new' })} className="gap-1.5">
                    <Plus size={14} strokeWidth={2} /> Neue Zeile
                  </Button>
                </div>
              </div>

              {/* Grid */}
              <div className="overflow-x-auto">
                {dataQ.isLoading && <div className="p-6"><Spinner size={16} /></div>}
                {data && (
                  <table className="w-full text-[12px]">
                    <thead className="bg-muted text-muted-foreground uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-2 py-2 text-left font-semibold w-px whitespace-nowrap">Aktion</th>
                        {data.columns.map((c) => (
                          <th key={c.column_name} className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              {pk.includes(c.column_name) && <KeyRound size={10} strokeWidth={2} className="text-amber-600 dark:text-amber-400" />}
                              {c.column_name}
                            </span>
                            <span className="ml-1 font-mono normal-case text-[9px] text-muted-foreground/60">{c.udt_name}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.rows.length === 0 && (
                        <tr><td colSpan={data.columns.length + 1} className="px-3 py-6 text-center text-muted-foreground">Keine Zeilen.</td></tr>
                      )}
                      {data.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-accent/40 align-top">
                          <td className="px-2 py-1.5 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setEditor({ mode: 'edit', row })} title="Bearbeiten"
                                className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent">
                                <Pencil size={13} strokeWidth={1.75} />
                              </button>
                              <button onClick={() => onDelete(row)} title="Löschen"
                                className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                <Trash2 size={13} strokeWidth={1.75} />
                              </button>
                            </div>
                          </td>
                          {data.columns.map((c) => {
                            const v = row[c.column_name]
                            const text = display(v)
                            return (
                              <td key={c.column_name} className={cn(
                                'px-3 py-1.5 whitespace-nowrap max-w-[22rem] truncate',
                                v === null && 'text-muted-foreground/40 italic',
                                pk.includes(c.column_name) && 'font-mono text-foreground/90',
                              )} title={text}>
                                {text.length > 80 ? text.slice(0, 80) + '…' : text}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {data && data.total > PAGE && (
                <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
                  <Button size="sm" variant="outline" disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - PAGE))} className="gap-1">
                    <ChevronLeft size={14} /> Zurück
                  </Button>
                  <Button size="sm" variant="outline" disabled={offset + PAGE >= data.total}
                    onClick={() => setOffset(offset + PAGE)} className="gap-1">
                    Weiter <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {editor && data && (
        <RowEditor
          table={selected!}
          columns={data.columns}
          primaryKey={pk}
          mode={editor.mode}
          row={editor.mode === 'edit' ? editor.row : undefined}
          busy={insertM.isPending || updateM.isPending}
          onCancel={() => setEditor(null)}
          onSubmit={(values) => {
            if (editor.mode === 'new') insertM.mutate(values)
            else updateM.mutate({ key: keyOf(editor.row), values })
          }}
        />
      )}
    </div>
  )
}

/** Modal form for creating or editing a single row. */
function RowEditor({
  table, columns, primaryKey, mode, row, busy, onCancel, onSubmit,
}: {
  table: string
  columns: DevColumn[]
  primaryKey: string[]
  mode: 'new' | 'edit'
  row?: Record<string, unknown>
  busy: boolean
  onCancel: () => void
  onSubmit: (values: Record<string, unknown>) => void
}) {
  // value text per column + an explicit "is null" flag (only meaningful for nullable columns)
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(columns.map((c) => [c.column_name, row && row[c.column_name] != null ? String(row[c.column_name]) : ''])),
  )
  const [nulls, setNulls] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(columns.map((c) => [c.column_name, mode === 'edit' && row ? row[c.column_name] === null : false])),
  )

  const setVal = (c: string, v: string) => setVals((s) => ({ ...s, [c]: v }))
  const setNull = (c: string, on: boolean) => setNulls((s) => ({ ...s, [c]: on }))

  function submit() {
    if (mode === 'new') {
      const out: Record<string, unknown> = {}
      columns.forEach((c) => {
        const name = c.column_name
        if (nulls[name]) return                 // leave null / default
        if (vals[name] === '') return           // blank → let DB default apply
        out[name] = vals[name]
      })
      if (Object.keys(out).length === 0) { toast.error('Keine Werte angegeben'); return }
      onSubmit(out)
      return
    }
    // edit → send only changed columns
    const out: Record<string, unknown> = {}
    columns.forEach((c) => {
      const name = c.column_name
      const orig = row && row[name] != null ? String(row[name]) : null
      const cur = nulls[name] ? null : vals[name]
      if (cur !== orig) out[name] = cur          // null or string
    })
    if (Object.keys(out).length === 0) { toast('Keine Änderungen'); onCancel(); return }
    onSubmit(out)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 py-10" onClick={onCancel}>
      <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="eyebrow">{mode === 'new' ? 'Neue Zeile' : 'Zeile bearbeiten'}</div>
            <div className="font-mono text-[13px] font-medium text-foreground">{table}</div>
          </div>
          <button onClick={onCancel} className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-4">
          {columns.map((c) => {
            const name = c.column_name
            const nullable = c.is_nullable === 'YES'
            const isNull = nulls[name]
            return (
              <div key={name} className="grid grid-cols-[10rem_1fr] items-start gap-3">
                <label className="pt-2 text-right">
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground">
                    {primaryKey.includes(name) && <KeyRound size={10} strokeWidth={2} className="text-amber-600 dark:text-amber-400" />}
                    {name}
                  </span>
                  <div className="font-mono text-[10px] text-muted-foreground/70">
                    {c.udt_name}{nullable ? '' : ' · not null'}
                    {c.column_default ? ' · default' : ''}
                  </div>
                </label>
                <div className="space-y-1">
                  {isBool(c) ? (
                    <select
                      className="flex h-9 w-full rounded border border-input bg-background px-3 py-1.5 text-sm disabled:opacity-50"
                      value={vals[name]} disabled={isNull}
                      onChange={(e) => setVal(name, e.target.value)}
                    >
                      <option value="">—</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : isLong(c) ? (
                    <Textarea className="min-h-[72px]" value={vals[name]} disabled={isNull} onChange={(e) => setVal(name, e.target.value)} />
                  ) : (
                    <Input value={vals[name]} disabled={isNull} onChange={(e) => setVal(name, e.target.value)}
                      placeholder={c.column_default ? `default: ${c.column_default}` : ''} />
                  )}
                  {nullable && (
                    <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground select-none">
                      <input type="checkbox" checked={isNull} onChange={(e) => setNull(name, e.target.checked)} />
                      NULL
                    </label>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="ghost" onClick={onCancel}>Abbrechen</Button>
          <Button onClick={submit} disabled={busy} className="gap-1.5">
            {busy ? <Spinner size={12} className="text-current" /> : null}
            {mode === 'new' ? 'Anlegen' : 'Speichern'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
