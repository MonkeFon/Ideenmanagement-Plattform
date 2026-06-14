import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { IdeaApi } from '@/api/endpoints'
import StageBadge, { stageLabels } from '@/components/StageBadge'
import Spinner from '@/components/Spinner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { GraphEdge, GraphNode, Stage } from '@/types/api'
import { Network, RefreshCw } from 'lucide-react'

/**
 * Force-directed map of semantically related ideas with cluster overlay.
 *
 * Clusters = connected components in the similarity graph at the current threshold.
 * They're computed via union-find each time the data changes, then rendered as a soft
 * background convex hull behind the nodes. Cluster colours come from a small qualitative
 * palette and are assigned by a stable hash so the same cluster keeps the same colour
 * across re-renders as the user nudges the threshold.
 *
 * The simulation itself is intentionally tiny (no d3-force / cytoscape dependency).
 */

type SimNode = GraphNode & {
  x: number; y: number; vx: number; vy: number
  degree: number; cluster: number
}
type SimEdge = GraphEdge & { weight: number }

// Stage palette — mid-saturation so it reads on both light and dark backgrounds.
const STAGE_FILL: Record<Stage, string> = {
  DRAFT: '#94a3b8',
  SUBMITTED: '#64748b',
  UNDER_REVIEW: '#d97706',
  PRIORITIZATION: '#d97706',
  APPROVED: '#059669',
  IN_IMPLEMENTATION: '#0891b2',
  DONE: '#059669',
  REJECTED: '#e11d48',
  ARCHIVED: '#94a3b8',
}

// Qualitative cluster palette. Cluster -1 (singletons) is rendered with no hull.
const CLUSTER_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#84cc16', // lime
  '#f43f5e', // rose
]

const WIDTH = 1100
const HEIGHT = 720
const TICKS = 400
const TICK_DT = 0.85

// Union-find for connected components.
function unionFind(ids: string[], edges: GraphEdge[]) {
  const parent = new Map<string, string>()
  ids.forEach((id) => parent.set(id, id))
  const find = (a: string): string => {
    let p = parent.get(a)!
    while (p !== a) { a = p; p = parent.get(a)! }
    return a
  }
  const union = (a: string, b: string) => {
    const ra = find(a), rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }
  for (const e of edges) union(e.source, e.target)

  // Group by root, assign stable cluster index ordered by smallest member id (lexicographic).
  const groups = new Map<string, string[]>()
  for (const id of ids) {
    const r = find(id)
    if (!groups.has(r)) groups.set(r, [])
    groups.get(r)!.push(id)
  }
  const sortedRoots = [...groups.keys()]
    .filter((r) => groups.get(r)!.length >= 2)
    .sort((a, b) => {
      const sa = [...groups.get(a)!].sort()[0]
      const sb = [...groups.get(b)!].sort()[0]
      return sa < sb ? -1 : sa > sb ? 1 : 0
    })
  const clusterIndex = new Map<string, number>()
  sortedRoots.forEach((r, i) => clusterIndex.set(r, i))

  const nodeCluster = new Map<string, number>()
  for (const id of ids) {
    const r = find(id)
    nodeCluster.set(id, clusterIndex.has(r) ? clusterIndex.get(r)! : -1)
  }
  return { nodeCluster, clusterCount: sortedRoots.length }
}

// Andrew's monotone chain convex hull.
function convexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length < 3) return points.slice()
  const pts = points.slice().sort((a, b) => (a.x - b.x) || (a.y - b.y))
  const cross = (O: any, A: any, B: any) =>
    (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x)
  const lower: typeof pts = []
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: typeof pts = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  lower.pop(); upper.pop()
  return lower.concat(upper)
}

// Expand a hull outward from its centroid by `margin` so node circles sit comfortably inside.
function expandHull(hull: { x: number; y: number }[], margin: number) {
  if (hull.length === 0) return hull
  const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length
  const cy = hull.reduce((s, p) => s + p.y, 0) / hull.length
  return hull.map((p) => {
    const dx = p.x - cx, dy = p.y - cy
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    return { x: p.x + (dx / len) * margin, y: p.y + (dy / len) * margin }
  })
}

// Uniformly scale + recenter the settled nodes so the graph fills the canvas instead of
// clumping in the middle. Force-directed layouts produce a good *relative* arrangement, but
// the absolute size depends on the force constants vs. node count — so we "zoom to fit" the
// final result (preserving aspect ratio and relative structure). Padding leaves room for
// node radii and the labels that sit above each node.
function fitToCanvas(nodes: SimNode[], pad = 80) {
  if (nodes.length < 2) return
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (const n of nodes) {
    if (n.x < x0) x0 = n.x
    if (n.x > x1) x1 = n.x
    if (n.y < y0) y0 = n.y
    if (n.y > y1) y1 = n.y
  }
  const bw = x1 - x0, bh = y1 - y0
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
  // Guard degenerate axes (e.g. two nodes in a vertical line); cap the upscale so a tiny
  // 2–3 node graph isn't flung into the far corners.
  const sx = bw > 1 ? (WIDTH - pad * 2) / bw : Infinity
  const sy = bh > 1 ? (HEIGHT - pad * 2) / bh : Infinity
  let scale = Math.min(sx, sy)
  if (!isFinite(scale)) return
  scale = Math.max(1, Math.min(scale, 3.2))
  const gcx = WIDTH / 2, gcy = HEIGHT / 2
  for (const n of nodes) {
    n.x = gcx + (n.x - cx) * scale
    n.y = gcy + (n.y - cy) * scale
  }
}

// Run the whole force simulation to convergence in one synchronous pass, mutating the
// nodes' x/y in place. Doing this *before* the first render (instead of animating one
// tick per requestAnimationFrame) means the graph paints already laid out — no janky
// "fly in from random positions" on load. For the graph sizes here (tens of nodes,
// O(n²) repulsion) this is well under a frame's budget.
function runLayout(nodes: SimNode[], edges: SimEdge[], byId: Map<string, SimNode>) {
  const repulsion = 9000
  const cx = WIDTH / 2, cy = HEIGHT / 2
  const damping = 0.78
  for (let t = 0; t < TICKS; t++) {
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]
        let dx = a.x - b.x
        let dy = a.y - b.y
        let dist2 = dx * dx + dy * dy
        if (dist2 < 1) { dist2 = 1; dx = (Math.random() - 0.5); dy = (Math.random() - 0.5) }
        const force = repulsion / dist2
        const dist = Math.sqrt(dist2)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx += fx; a.vy += fy
        b.vx -= fx; b.vy -= fy
      }
    }
    for (const e of edges) {
      const a = byId.get(e.source); const b = byId.get(e.target)
      if (!a || !b) continue
      const dx = b.x - a.x, dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
      const target = 90 + (1 - e.weight) * 180
      const k = 0.04 * (0.3 + e.weight)
      const f = (dist - target) * k
      const fx = (dx / dist) * f
      const fy = (dy / dist) * f
      a.vx += fx; a.vy += fy
      b.vx -= fx; b.vy -= fy
    }
    for (const n of nodes) {
      n.vx += (cx - n.x) * 0.0015
      n.vy += (cy - n.y) * 0.0015
    }
    for (const n of nodes) {
      n.vx *= damping; n.vy *= damping
      n.x += n.vx * TICK_DT
      n.y += n.vy * TICK_DT
      n.x = Math.max(20, Math.min(WIDTH - 20, n.x))
      n.y = Math.max(20, Math.min(HEIGHT - 20, n.y))
    }
  }
  // Spread the settled blob out to fill the canvas.
  fitToCanvas(nodes)
}

export default function IdeaGraph() {
  const [threshold, setThreshold] = useState(0.55)
  const [hovered, setHovered] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [seed, setSeed] = useState(0)
  const [, setTick] = useState(0)
  const navigate = useNavigate()

  const graphQ = useQuery({
    queryKey: ['idea-graph', threshold],
    queryFn: () => IdeaApi.graph(threshold),
  })

  const sim = useMemo(() => {
    if (!graphQ.data) return null
    const { nodes, edges } = graphQ.data
    const degree: Record<string, number> = {}
    for (const e of edges) {
      degree[e.source] = (degree[e.source] ?? 0) + 1
      degree[e.target] = (degree[e.target] ?? 0) + 1
    }

    const { nodeCluster, clusterCount } = unionFind(nodes.map((n) => n.id), edges)

    const cx = WIDTH / 2, cy = HEIGHT / 2
    const r = Math.min(WIDTH, HEIGHT) * 0.35
    const simNodes: SimNode[] = nodes.map((n, i) => {
      const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2
      return {
        ...n,
        x: cx + Math.cos(angle) * r * (0.6 + Math.random() * 0.4),
        y: cy + Math.sin(angle) * r * (0.6 + Math.random() * 0.4),
        vx: 0, vy: 0,
        degree: degree[n.id] ?? 0,
        cluster: nodeCluster.get(n.id) ?? -1,
      }
    })
    const simEdges: SimEdge[] = edges.map((e) => ({ ...e, weight: e.similarity }))
    const byId = new Map(simNodes.map((n) => [n.id, n]))
    // Settle the layout synchronously so the first paint shows the final arrangement.
    runLayout(simNodes, simEdges, byId)
    return {
      nodes: simNodes,
      edges: simEdges,
      byId,
      clusterCount,
    }
    // `seed` is included so "Neu anordnen" recomputes a fresh settled layout.
  }, [graphQ.data, seed])

  // Group nodes by cluster for hull rendering. Recomputed each tick via the wrapper render.
  const clustersForRender = useMemo(() => {
    if (!sim) return []
    const groups = new Map<number, SimNode[]>()
    for (const n of sim.nodes) {
      if (n.cluster < 0) continue
      if (!groups.has(n.cluster)) groups.set(n.cluster, [])
      groups.get(n.cluster)!.push(n)
    }
    return [...groups.entries()].map(([id, nodes]) => ({ id, nodes }))
  }, [sim, /* tick triggers via setTick re-renders */ ])

  const restart = () => setSeed((s) => s + 1)

  const neighbors = useMemo(() => {
    if (!sim || !hovered) return new Set<string>()
    const s = new Set<string>()
    for (const e of sim.edges) {
      if (e.source === hovered) s.add(e.target)
      else if (e.target === hovered) s.add(e.source)
    }
    return s
  }, [sim, hovered])

  const svgRef = useRef<SVGSVGElement | null>(null)
  const pressStartRef = useRef<{ x: number; y: number } | null>(null)
  const draggedRef = useRef(false)
  const CLICK_DRAG_THRESHOLD_PX = 4

  function svgPoint(evt: React.PointerEvent) {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = evt.clientX; pt.y = evt.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: 0, y: 0 }
    const transformed = pt.matrixTransform(ctm.inverse())
    return { x: transformed.x, y: transformed.y }
  }

  function onPointerDown(id: string, evt: React.PointerEvent) {
    (evt.target as Element).setPointerCapture?.(evt.pointerId)
    pressStartRef.current = { x: evt.clientX, y: evt.clientY }
    draggedRef.current = false
    setDragging(id)
  }
  function onPointerMove(evt: React.PointerEvent) {
    if (!dragging || !sim) return
    if (pressStartRef.current && !draggedRef.current) {
      const dx = evt.clientX - pressStartRef.current.x
      const dy = evt.clientY - pressStartRef.current.y
      if (dx * dx + dy * dy > CLICK_DRAG_THRESHOLD_PX * CLICK_DRAG_THRESHOLD_PX) {
        draggedRef.current = true
      }
    }
    const { x, y } = svgPoint(evt)
    const n = sim.byId.get(dragging)
    if (!n) return
    n.x = x; n.y = y; n.vx = 0; n.vy = 0
    setTick((t) => t + 1)
  }
  function onPointerUp() {
    if (!dragging) return
    pressStartRef.current = null
    setDragging(null)
  }

  const hoveredNode = hovered && sim ? sim.byId.get(hovered) : null

  return (
    <div className="p-4 md:p-8 space-y-5 max-w-7xl mx-auto">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="eyebrow">Graph</div>
          <h1 className="mt-1 text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Network size={18} strokeWidth={1.75} className="text-muted-foreground" />
            Semantische Karte
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Verbundene Ideen bilden automatisch Cluster. Ziehen zum Verschieben, klicken zum Öffnen.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-[12px] text-muted-foreground flex items-center gap-2">
            <span className="uppercase tracking-wider text-[11px] text-muted-foreground font-medium">Schwelle</span>
            <input
              type="range"
              min={0.30} max={0.95} step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-32 md:w-40 accent-slate-900 dark:accent-slate-100"
            />
            <span className="font-mono text-[11px] w-9 text-right tabular-nums">{(threshold * 100).toFixed(0)}%</span>
          </label>
          <Button variant="secondary" size="sm" onClick={restart} title="Layout neu berechnen">
            <RefreshCw size={13} strokeWidth={1.75} /> Neu anordnen
          </Button>
        </div>
      </header>

      {/* Stage legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        {(Object.keys(STAGE_FILL) as Stage[])
          .filter((s) => s !== 'DRAFT')
          .map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STAGE_FILL[s] }} />
              {stageLabels[s]}
            </span>
          ))}
      </div>

      <Card className="overflow-hidden">
        {graphQ.isLoading && <div className="p-8"><Spinner label="Graph wird geladen…" /></div>}
        {graphQ.error && <div className="p-8 text-sm text-destructive">Graph konnte nicht geladen werden.</div>}
        {sim && sim.nodes.length === 0 && (
          <div className="p-8 text-sm text-muted-foreground text-center">
            Noch keine Ideen darzustellen. Reichen Sie einige Ideen ein (und stellen Sie sicher, dass Embeddings vorhanden sind), damit Beziehungen sichtbar werden.
          </div>
        )}
        {sim && sim.nodes.length > 0 && (
          <div key={seed} className="relative animate-in fade-in duration-500">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="w-full h-[60vh] min-h-[420px] md:h-[720px] bg-slate-50 dark:bg-slate-950 select-none touch-none"
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              {/* cluster hulls (rendered first so they sit behind everything) */}
              <g>
                {clustersForRender.map(({ id, nodes }) => {
                  if (nodes.length < 2) return null
                  const color = CLUSTER_COLORS[id % CLUSTER_COLORS.length]
                  if (nodes.length === 2) {
                    // Two-node cluster: render a thick translucent capsule connecting them.
                    const [a, b] = nodes
                    return (
                      <line
                        key={'h' + id}
                        x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                        stroke={color}
                        strokeOpacity={0.18}
                        strokeWidth={40}
                        strokeLinecap="round"
                      />
                    )
                  }
                  const hull = expandHull(convexHull(nodes), 30)
                  const path = 'M ' + hull.map((p) => `${p.x},${p.y}`).join(' L ') + ' Z'
                  return (
                    <path
                      key={'h' + id}
                      d={path}
                      fill={color}
                      fillOpacity={0.14}
                      stroke={color}
                      strokeOpacity={0.35}
                      strokeWidth={1}
                    />
                  )
                })}
              </g>

              {/* edges */}
              <g stroke="#94a3b8" strokeOpacity={0.35}>
                {sim.edges.map((e, idx) => {
                  const a = sim.byId.get(e.source); const b = sim.byId.get(e.target)
                  if (!a || !b) return null
                  const isHi = hovered && (e.source === hovered || e.target === hovered)
                  return (
                    <line
                      key={idx}
                      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      strokeWidth={0.5 + e.weight * 2.5}
                      stroke={isHi ? '#0f172a' : '#94a3b8'}
                      strokeOpacity={isHi ? 0.85 : 0.25 + e.weight * 0.4}
                    />
                  )
                })}
              </g>
              {/* nodes */}
              <g>
                {sim.nodes.map((n) => {
                  const r = 6 + Math.min(14, Math.sqrt(n.degree) * 4)
                  const dim = hovered && n.id !== hovered && !neighbors.has(n.id)
                  return (
                    <g key={n.id}
                       transform={`translate(${n.x},${n.y})`}
                       onPointerDown={(e) => onPointerDown(n.id, e)}
                       onPointerEnter={() => setHovered(n.id)}
                       onPointerLeave={() => setHovered((h) => (h === n.id ? null : h))}
                       onClick={() => {
                         const wasDrag = draggedRef.current
                         draggedRef.current = false
                         if (!wasDrag) navigate(`/ideas/${n.id}`)
                       }}
                       style={{ cursor: dragging ? 'grabbing' : 'pointer' }}
                    >
                      <circle
                        r={r}
                        fill={STAGE_FILL[n.stage]}
                        fillOpacity={dim ? 0.25 : 0.92}
                        stroke="white"
                        strokeWidth={2}
                        className="dark:[stroke:#0f172a]"
                      />
                      <text
                        y={-r - 6}
                        textAnchor="middle"
                        className="fill-foreground stroke-background"
                        fontSize={11}
                        fontWeight={500}
                        // paint-order draws the stroke first, so the background-coloured halo
                        // sits *behind* the glyph fill — letters stay readable when labels
                        // cross edges or other nodes.
                        style={{ pointerEvents: 'none', paintOrder: 'stroke', strokeWidth: 3, strokeLinejoin: 'round' }}
                        opacity={dim ? 0.3 : 1}
                      >
                        {n.title.length > 32 ? n.title.slice(0, 30) + '…' : n.title}
                      </text>
                    </g>
                  )
                })}
              </g>
            </svg>

            {/* Hover detail panel */}
            {hoveredNode && (
              <Card className="absolute top-3 left-3 p-3 max-w-xs pointer-events-none">
                <div className="text-[13px] font-semibold text-foreground tracking-tight">{hoveredNode.title}</div>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <StageBadge stage={hoveredNode.stage} />
                  {hoveredNode.category && <span>{hoveredNode.category}</span>}
                  {hoveredNode.cluster >= 0 && (
                    <span
                      className="inline-flex items-center gap-1 font-mono uppercase tracking-wider text-[10px]"
                      style={{ color: CLUSTER_COLORS[hoveredNode.cluster % CLUSTER_COLORS.length] }}
                    >
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[hoveredNode.cluster % CLUSTER_COLORS.length] }} />
                      Cluster {hoveredNode.cluster + 1}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground tabular-nums">
                  {hoveredNode.netVotes >= 0 ? '+' : ''}{hoveredNode.netVotes} Stimmen · {neighbors.size} verwandt
                </div>
              </Card>
            )}

            <div className="absolute bottom-3 right-3 text-[11px] text-muted-foreground bg-card/90 border border-border px-2 py-1 rounded tabular-nums font-mono">
              {sim.nodes.length} Knoten · {sim.edges.length} Kanten · {sim.clusterCount} Cluster
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
