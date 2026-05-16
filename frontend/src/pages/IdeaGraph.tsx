import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { IdeaApi } from '@/api/endpoints'
import StageBadge, { stageLabels } from '@/components/StageBadge'
import type { GraphEdge, GraphNode, Stage } from '@/types/api'
import { Network, RefreshCw } from 'lucide-react'

/**
 * Force-directed map of semantically related ideas.
 *
 * The simulation is intentionally tiny (no d3-force or cytoscape dependency) — Barnes–Hut
 * isn't needed at the scale we expect (a few hundred nodes per tenant). It runs for a fixed
 * number of ticks after each data/threshold change, then stops; we re-spawn it only when the
 * user drags or changes inputs.
 */

type SimNode = GraphNode & { x: number; y: number; vx: number; vy: number; degree: number }
type SimEdge = GraphEdge & { weight: number }

const STAGE_FILL: Record<Stage, string> = {
  DRAFT: '#94a3b8',
  SUBMITTED: '#3a66ff',
  UNDER_REVIEW: '#f59e0b',
  PRIORITIZATION: '#f59e0b',
  APPROVED: '#10b981',
  IN_IMPLEMENTATION: '#3a66ff',
  DONE: '#10b981',
  REJECTED: '#f43f5e',
  ARCHIVED: '#94a3b8',
}

const WIDTH = 1100
const HEIGHT = 720
const TICKS = 400
const TICK_DT = 0.85

export default function IdeaGraph() {
  const [threshold, setThreshold] = useState(0.55)
  const [hovered, setHovered] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [seed, setSeed] = useState(0) // bump to re-run the simulation
  const [, setTick] = useState(0) // forces re-render during simulation
  const navigate = useNavigate()

  const graphQ = useQuery({
    queryKey: ['idea-graph', threshold],
    queryFn: () => IdeaApi.graph(threshold),
  })

  // Build the simulation state. Re-runs when payload or threshold changes.
  const sim = useMemo(() => {
    if (!graphQ.data) return null
    const { nodes, edges } = graphQ.data
    const degree: Record<string, number> = {}
    for (const e of edges) {
      degree[e.source] = (degree[e.source] ?? 0) + 1
      degree[e.target] = (degree[e.target] ?? 0) + 1
    }
    // Seed positions on a circle so the layout starts disordered but bounded.
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
      }
    })
    const simEdges: SimEdge[] = edges.map((e) => ({ ...e, weight: e.similarity }))
    return { nodes: simNodes, edges: simEdges, byId: new Map(simNodes.map((n) => [n.id, n])) }
  }, [graphQ.data])

  // Run the simulation loop. We mutate node positions in place for cheapness, then
  // bump a tick counter to trigger React re-renders.
  const rafRef = useRef<number | null>(null)
  const remainingTicksRef = useRef(0)
  useEffect(() => {
    if (!sim) return
    remainingTicksRef.current = TICKS
    const step = () => {
      if (!sim) return
      const draggedId = dragging
      // Repulsion: O(n^2). Fine for ≤ ~500 nodes; we don't expect more in a tenant view.
      const repulsion = 9000
      for (let i = 0; i < sim.nodes.length; i++) {
        const a = sim.nodes[i]
        for (let j = i + 1; j < sim.nodes.length; j++) {
          const b = sim.nodes[j]
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
      // Spring attraction along edges. Stiffer when more similar.
      for (const e of sim.edges) {
        const a = sim.byId.get(e.source); const b = sim.byId.get(e.target)
        if (!a || !b) continue
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01
        const target = 90 + (1 - e.weight) * 180 // ideal length: similar pairs sit closer
        const k = 0.04 * (0.3 + e.weight) // stiffness scales with similarity
        const f = (dist - target) * k
        const fx = (dx / dist) * f
        const fy = (dy / dist) * f
        a.vx += fx; a.vy += fy
        b.vx -= fx; b.vy -= fy
      }
      // Gentle gravity toward the centre keeps disconnected clusters from drifting off-canvas.
      const cx = WIDTH / 2, cy = HEIGHT / 2
      for (const n of sim.nodes) {
        n.vx += (cx - n.x) * 0.0015
        n.vy += (cy - n.y) * 0.0015
      }
      // Integrate + damping + clamp to viewport.
      const damping = 0.78
      for (const n of sim.nodes) {
        if (n.id === draggedId) { n.vx = 0; n.vy = 0; continue }
        n.vx *= damping; n.vy *= damping
        n.x += n.vx * TICK_DT
        n.y += n.vy * TICK_DT
        n.x = Math.max(20, Math.min(WIDTH - 20, n.x))
        n.y = Math.max(20, Math.min(HEIGHT - 20, n.y))
      }
      remainingTicksRef.current -= 1
      setTick((t) => t + 1)
      if (remainingTicksRef.current > 0) {
        rafRef.current = requestAnimationFrame(step)
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null } }
  }, [sim, dragging, seed])

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

  // Drag handling (SVG coords; account for viewBox scaling via getCTM).
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pressStartRef = useRef<{ x: number; y: number } | null>(null)
  // True once the pointer has moved past the click threshold during a press —
  // used to suppress the synthetic click that fires on pointer release after a drag.
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
    setDragging(null) // effect re-runs and resumes the simulation
    // draggedRef stays true until the synthetic click fires; the click handler resets it.
  }

  const hoveredNode = hovered && sim ? sim.byId.get(hovered) : null

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Network size={22} className="text-brand-600" />
            Idea graph
          </h1>
          <p className="text-slate-500 mt-1">
            Each node is an idea; edges link semantically similar pairs. Drag to rearrange, click to open.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-600 flex items-center gap-2">
            Min similarity
            <input
              type="range"
              min={0.30} max={0.95} step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-32 md:w-40"
            />
            <span className="font-mono text-xs w-10 text-right">{(threshold * 100).toFixed(0)}%</span>
          </label>
          <button className="btn-secondary" onClick={restart} title="Re-run layout">
            <RefreshCw size={16} /> Re-layout
          </button>
        </div>
      </header>

      {/* Stage legend */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        {(Object.keys(STAGE_FILL) as Stage[])
          .filter((s) => s !== 'DRAFT') // DRAFTs are excluded server-side
          .map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: STAGE_FILL[s] }} />
              {stageLabels[s]}
            </span>
          ))}
      </div>

      <div className="card overflow-hidden">
        {graphQ.isLoading && <div className="p-8 text-sm text-slate-500">Loading graph…</div>}
        {graphQ.error && <div className="p-8 text-sm text-rose-600">Failed to load graph.</div>}
        {sim && sim.nodes.length === 0 && (
          <div className="p-8 text-sm text-slate-500 text-center">
            No ideas to plot yet. Submit a few ideas (and make sure embeddings are indexed) to see relationships emerge.
          </div>
        )}
        {sim && sim.nodes.length > 0 && (
          <div className="relative">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="w-full h-[60vh] min-h-[420px] md:h-[720px] bg-surface select-none touch-none"
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
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
                      stroke={isHi ? '#2748f5' : '#94a3b8'}
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
                      />
                      {(hovered === n.id || neighbors.has(n.id) || sim.nodes.length <= 25) && (
                        <text
                          y={-r - 6}
                          textAnchor="middle"
                          className="fill-slate-800"
                          fontSize={11}
                          fontWeight={500}
                          style={{ pointerEvents: 'none' }}
                        >
                          {n.title.length > 32 ? n.title.slice(0, 30) + '…' : n.title}
                        </text>
                      )}
                    </g>
                  )
                })}
              </g>
            </svg>

            {/* Hover detail panel */}
            {hoveredNode && (
              <div className="absolute top-3 left-3 card p-3 max-w-xs pointer-events-none shadow-card">
                <div className="text-sm font-semibold text-slate-900">{hoveredNode.title}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <StageBadge stage={hoveredNode.stage} />
                  {hoveredNode.category && <span>· {hoveredNode.category}</span>}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {hoveredNode.netVotes >= 0 ? '+' : ''}{hoveredNode.netVotes} votes · {neighbors.size} related
                </div>
              </div>
            )}
            <div className="absolute bottom-3 right-3 text-xs text-slate-500 bg-white/80 px-2 py-1 rounded">
              {sim.nodes.length} ideas · {sim.edges.length} edges
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

