import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import type {
  Roadmap,
  ProgressStats,
  RoadmapItem,
  RoadmapItemWithLockStatus,
} from '@/types/roadmap.types'

type RoadmapVisualNode = RoadmapItem | RoadmapItemWithLockStatus

interface RoadmapVisualTimelineProps {
  roadmap: Roadmap
  items: RoadmapVisualNode[]
  progress: ProgressStats
  onItemClick?: (itemId: string) => void
  className?: string
}

const ITEMS_PER_ROW = 5
const NODE_R = 42 // node circle radius
const NODE_SPACING_X = 200 // horizontal distance between node centers
const ROW_HEIGHT = 240 // vertical distance between row centers
const PAD_X = 80 // left/right padding
const PAD_Y = 100 // top/bottom padding (extra room for START/FINISH labels)

// ─── helpers ────────────────────────────────────────────────────────────────

function truncate(text: string, max: number) {
  return text.length <= max ? text : text.slice(0, max - 1) + '…'
}

/** SVG circular-arc progress ring (like the 40% ring in the header) */
function CircleProgress({
  pct,
  r = 40,
  stroke = 7,
}: {
  pct: number
  r?: number
  stroke?: number
}) {
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const size = (r + stroke) * 2
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {/* track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#1e3a2a"
        strokeWidth={stroke}
      />
      {/* filled */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#22c55e"
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 6px #22c55e88)' }}
      />
    </svg>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export const RoadmapVisualTimeline = React.memo<RoadmapVisualTimelineProps>(
  ({ roadmap, items, progress, onItemClick, className = '' }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState(0)

    // sorted items
    const sorted = useMemo(
      () => [...items].sort((a, b) => a.order - b.order),
      [items]
    )

    // container width observer
    useEffect(() => {
      const update = () => {
        if (containerRef.current)
          setContainerWidth(containerRef.current.offsetWidth)
      }
      update()
      const ro = new ResizeObserver(update)
      if (containerRef.current) ro.observe(containerRef.current)
      return () => ro.disconnect()
    }, [])

    // dynamic items-per-row (keep 6 but clamp to available width)
    const itemsPerRow = useMemo(() => {
      if (containerWidth === 0) return ITEMS_PER_ROW
      const maxFit = Math.floor((containerWidth - PAD_X * 2) / 130)
      return Math.max(2, Math.min(ITEMS_PER_ROW, maxFit))
    }, [containerWidth])

    // dynamic spacing
    const spacingX = useMemo(() => {
      if (containerWidth === 0) return NODE_SPACING_X
      const avail = containerWidth - PAD_X * 2
      return Math.max(
        120,
        Math.min(NODE_SPACING_X, avail / Math.max(itemsPerRow - 1, 1))
      )
    }, [containerWidth, itemsPerRow])

    // node positions (snake pattern)
    // Key fix: ALL rows use the same fixed column grid so RTL partial rows align correctly.
    const positions = useMemo(() => {
      // Fixed row width based on itemsPerRow (same for every row)
      const rowWidth = (itemsPerRow - 1) * spacingX
      const startX = PAD_X + (containerWidth - PAD_X * 2 - rowWidth) / 2

      return sorted.map((item, idx) => {
        const row = Math.floor(idx / itemsPerRow)
        const colInRow = idx % itemsPerRow
        const reversed = row % 2 === 1
        // RTL: first item of this row goes to rightmost column (itemsPerRow-1),
        //      second item to (itemsPerRow-2), etc. → partial rows are right-anchored.
        const col = reversed ? itemsPerRow - 1 - colInRow : colInRow
        return {
          x: startX + col * spacingX,
          y: PAD_Y + row * ROW_HEIGHT,
          item,
          row,
          colInRow,
          reversed,
        }
      })
    }, [sorted, itemsPerRow, spacingX, containerWidth])

    // SVG canvas size
    const svgW = useMemo(() => containerWidth || 800, [containerWidth])
    const svgH = useMemo(() => {
      if (positions.length === 0) return 200
      // 90 = bottom padding: label(18) + badges(16) + "đang học"(20) + gap(36)
      return Math.max(...positions.map(p => p.y)) + 90 + 90
    }, [positions])

    // completed set
    const completedSet = useMemo(
      () => new Set(progress.completedItems),
      [progress.completedItems]
    )

    // find "current" (first unlocked, not completed)
    const currentId = useMemo(() => {
      for (const item of sorted) {
        const isCompleted =
          'isCompleted' in item ? item.isCompleted : completedSet.has(item.id)
        const isUnlocked = 'isUnlocked' in item ? item.isUnlocked : true
        if (!isCompleted && isUnlocked) return item.id
      }
      return null
    }, [sorted, completedSet])

    const pct =
      progress.total > 0
        ? Math.round((progress.completed / progress.total) * 100)
        : 0

    const handleClick = useCallback(
      (item: RoadmapVisualNode) => {
        const isUnlocked = 'isUnlocked' in item ? item.isUnlocked : true
        if (isUnlocked) onItemClick?.(item.id)
      },
      [onItemClick]
    )

    if (sorted.length === 0) {
      return (
        <div
          className={`flex items-center justify-center py-16 text-slate-400 ${className}`}
        >
          <p>No items in this roadmap yet.</p>
        </div>
      )
    }

    // ── render ─────────────────────────────────────────────────────────────
    return (
      <div className={`space-y-4 ${className}`}>
        {/* ── HEADER: title + desc */}
        <div>
          <h2 className="text-2xl font-bold text-white">{roadmap.title}</h2>
          {roadmap.description && (
            <p className="mt-1 text-sm text-slate-400">{roadmap.description}</p>
          )}
        </div>

        {/* ── PROGRESS CARD ─────────────────────────────────────────── */}
        <div
          style={{
            background: 'linear-gradient(135deg,#0d1f14 0%,#111827 100%)',
            border: '1px solid #1e3a2a',
          }}
          className="rounded-2xl p-5"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-green-400">
            Tiến độ
          </p>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            {/* ring */}
            <div className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center">
              <CircleProgress pct={pct} r={40} stroke={7} />
              <span
                className="absolute text-lg font-bold text-white"
                style={{ textShadow: '0 0 8px #22c55eaa' }}
              >
                {pct}%
              </span>
            </div>

            {/* text */}
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold text-white">
                <span className="text-green-400">{progress.completed}</span>/
                {progress.total} hoàn thành ({pct}%)
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {pct >= 80
                  ? 'Xuất sắc! Bạn gần hoàn thành rồi 🎉'
                  : pct >= 50
                    ? 'Tiếp tục phát huy nhé! 💪'
                    : 'Bạn đang học rất tốt! Hãy tiếp tục phát huy.'}
              </p>
            </div>

            {/* progress bar + legend */}
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-2 flex-1 rounded-full"
                  style={{ background: '#1a2e1a' }}
                >
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg,#22c55e,#16a34a)',
                      boxShadow: '0 0 8px #22c55e88',
                    }}
                  />
                </div>
                <span className="whitespace-nowrap text-xs font-medium text-slate-400">
                  {progress.completed}/{progress.total}
                </span>
              </div>

              {/* legend */}
              <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                  Hoàn thành
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
                  Đang làm
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: '#334155' }}
                  />
                  Chưa bắt đầu
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SNAKE ROAD ────────────────────────────────────────────── */}
        <div
          ref={containerRef}
          data-testid="timeline-snake"
          style={{
            background:
              'linear-gradient(160deg,#060d18 0%,#0a1628 50%,#060d18 100%)',
            border: '1px solid #1e293b',
            backgroundImage: `
              linear-gradient(160deg,#060d18 0%,#0a1628 50%,#060d18 100%),
              radial-gradient(circle, #1e293b 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 28px 28px',
          }}
          className="overflow-x-auto rounded-2xl"
        >
          {containerWidth > 0 && (
            <svg
              width={svgW}
              height={svgH}
              className="block"
              style={{ minWidth: svgW }}
            >
              <defs>
                {/* glow filter green */}
                <filter
                  id="glow-g"
                  x="-40%"
                  y="-40%"
                  width="180%"
                  height="180%"
                >
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* glow filter blue (current) */}
                <filter
                  id="glow-b"
                  x="-40%"
                  y="-40%"
                  width="180%"
                  height="180%"
                >
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* node drop-shadow */}
                <filter id="nsh" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow
                    dx="0"
                    dy="3"
                    stdDeviation="5"
                    floodColor="#000"
                    floodOpacity="0.5"
                  />
                </filter>
              </defs>

              {/* ── CONNECTORS (drawn first, behind nodes) */}
              {positions.map((pos, i) => {
                if (i === positions.length - 1) return null
                const next = positions[i + 1]
                const fromC = completedSet.has(pos.item.id)
                const toC = completedSet.has(next.item.id)
                const segC = fromC && toC
                const stroke = segC ? '#22c55e' : '#1e3a55'
                const sWidth = 3

                if (pos.row === next.row) {
                  // same row: horizontal dashed line with directional arrow
                  // RTL rows: pos.x > next.x (travelling right→left)
                  // LTR rows: pos.x < next.x (travelling left→right)
                  const isRTL = pos.x > next.x

                  // Endpoints of the line segment (between the two node edges)
                  // For LTR: from right edge of pos to left edge of next
                  // For RTL: from left edge of pos to right edge of next
                  const lineX1 = isRTL ? pos.x - NODE_R - 2 : pos.x + NODE_R + 2
                  const lineX2 = isRTL
                    ? next.x + NODE_R + 2
                    : next.x - NODE_R - 2
                  const y = pos.y
                  const mx = (lineX1 + lineX2) / 2

                  // Arrow points in direction of travel
                  // LTR → points right:  left-tip, right-tip, left-tip
                  // RTL → points left:   right-tip, left-tip, right-tip
                  const arrowPoints = isRTL
                    ? `${mx + 6},${y - 4} ${mx - 6},${y} ${mx + 6},${y + 4}`
                    : `${mx - 6},${y - 4} ${mx + 6},${y} ${mx - 6},${y + 4}`

                  return (
                    <g key={`conn-${i}`}>
                      <line
                        x1={lineX1}
                        y1={y}
                        x2={lineX2}
                        y2={y}
                        stroke={stroke}
                        strokeWidth={sWidth}
                        strokeDasharray={segC ? 'none' : '6 4'}
                        strokeLinecap="round"
                        filter={segC ? 'url(#glow-g)' : undefined}
                      />
                      {/* directional arrow head */}
                      <polygon
                        points={arrowPoints}
                        fill={segC ? '#22c55e' : '#1e3a55'}
                        opacity={0.9}
                      />
                    </g>
                  )
                } else {
                  // Row transition: simple vertical bezier
                  const x1 = pos.x
                  const y1 = pos.y + NODE_R + 4
                  const x2 = next.x
                  const y2 = next.y - NODE_R - 4
                  const mid = (y1 + y2) / 2
                  const path = `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`
                  return (
                    <path
                      key={`conn-${i}`}
                      d={path}
                      stroke={stroke}
                      strokeWidth={sWidth}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={segC ? 'none' : '6 4'}
                      filter={segC ? 'url(#glow-g)' : undefined}
                    />
                  )
                }
              })}

              {/* ── NODES */}
              {positions.map(({ x, y, item }) => {
                const isCompleted =
                  'isCompleted' in item
                    ? item.isCompleted
                    : completedSet.has(item.id)
                const isUnlocked = (
                  'isUnlocked' in item ? item.isUnlocked : true
                ) as boolean
                const isCurrent = item.id === currentId
                const isLocked = !isUnlocked

                // colours
                let fill = '#0f2236' // locked
                let strokeCol = '#1e3a55'
                let strokeW = 2
                if (isCompleted) {
                  fill = '#166534'
                  strokeCol = '#22c55e'
                  strokeW = 3
                } else if (isCurrent) {
                  fill = '#0c2a4a'
                  strokeCol = '#3b82f6'
                  strokeW = 3
                } else if (isUnlocked) {
                  fill = '#0f2236'
                  strokeCol = '#334155'
                  strokeW = 2
                }

                // outer glow ring
                const glowR = NODE_R + 7
                const showGlow = isCompleted || isCurrent

                // label
                const label = truncate(item.itemTitle || item.itemType, 16)

                // Single badge matching actual itemType
                const badgeLabel =
                  item.itemType === 'lesson' ? 'BÀI HỌC' : 'BÀI TẬP'
                const badgeColor =
                  item.itemType === 'lesson' ? '#93c5fd' : '#fbbf24'
                const badgeBg =
                  item.itemType === 'lesson' ? '#1e3a8a' : '#451a03'

                const labelY = y + NODE_R + 18
                const badgeY = labelY + 20

                return (
                  <g
                    key={item.id}
                    onClick={() => handleClick(item)}
                    style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.itemTitle} - ${isCompleted ? 'Hoàn thành' : isCurrent ? 'Đang học' : isLocked ? 'Chưa mở' : 'Chưa bắt đầu'}`}
                    aria-disabled={isLocked}
                    data-testid={`item-node-${item.id}`}
                    className="roadmap-node"
                  >
                    {/* glow ring */}
                    {showGlow && (
                      <circle
                        cx={x}
                        cy={y}
                        r={glowR}
                        fill="none"
                        stroke={isCompleted ? '#22c55e' : '#3b82f6'}
                        strokeWidth={2}
                        opacity={0.35}
                        filter={isCompleted ? 'url(#glow-g)' : 'url(#glow-b)'}
                      />
                    )}

                    {/* locked dashed ring */}
                    {isLocked && !isCompleted && (
                      <circle
                        cx={x}
                        cy={y}
                        r={NODE_R + 5}
                        fill="none"
                        stroke="#334155"
                        strokeWidth={1.5}
                        strokeDasharray="4 5"
                      />
                    )}

                    {/* main circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={NODE_R}
                      fill={fill}
                      stroke={strokeCol}
                      strokeWidth={strokeW}
                      filter="url(#nsh)"
                    />

                    {/* order number (large, inside) */}
                    <text
                      x={x}
                      y={y - (isCompleted ? 6 : 4)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={
                        isCompleted
                          ? '#bbf7d0'
                          : isCurrent
                            ? '#93c5fd'
                            : isLocked
                              ? '#475569'
                              : '#94a3b8'
                      }
                      fontSize={isCompleted ? 15 : 16}
                      fontWeight="700"
                      fontFamily="system-ui, sans-serif"
                    >
                      {item.order}
                    </text>

                    {/* icon below number */}
                    {isCompleted && (
                      <text
                        x={x}
                        y={y + 10}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#22c55e"
                        fontSize={14}
                        fontFamily="system-ui"
                      >
                        ✓
                      </text>
                    )}
                    {isCurrent && !isCompleted && (
                      <text
                        x={x}
                        y={y + 12}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#60a5fa"
                        fontSize={13}
                        fontFamily="system-ui"
                      >
                        📖
                      </text>
                    )}
                    {isLocked && !isCompleted && !isCurrent && (
                      <text
                        x={x}
                        y={y + 12}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#475569"
                        fontSize={13}
                        fontFamily="system-ui"
                      >
                        🔒
                      </text>
                    )}

                    {/* node title */}
                    <text
                      x={x}
                      y={labelY}
                      textAnchor="middle"
                      dominantBaseline="hanging"
                      fill={
                        isCompleted
                          ? '#86efac'
                          : isCurrent
                            ? '#93c5fd'
                            : '#94a3b8'
                      }
                      fontSize={11.5}
                      fontWeight="600"
                      fontFamily="system-ui, sans-serif"
                    >
                      {label}
                    </text>

                    {/* single badge */}
                    <SingleBadge
                      x={x}
                      y={badgeY}
                      label={badgeLabel}
                      bg={badgeBg}
                      color={badgeColor}
                    />

                    {/* "Đang học" label for current */}
                    {isCurrent && (
                      <g>
                        <rect
                          x={x - 28}
                          y={badgeY + 22}
                          width={56}
                          height={16}
                          rx={8}
                          fill="#1e3a5f"
                        />
                        <circle
                          cx={x - 16}
                          cy={badgeY + 30}
                          r={3.5}
                          fill="#3b82f6"
                        />
                        <text
                          x={x + 4}
                          y={badgeY + 30}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#60a5fa"
                          fontSize={9}
                          fontWeight="600"
                          fontFamily="system-ui"
                        >
                          Đang học
                        </text>
                      </g>
                    )}
                  </g>
                )
              })}

              {/* ── START label above first node */}
              {positions.length > 0 &&
                (() => {
                  const first = positions[0]
                  return (
                    <g key="start-flag">
                      {/* flag pole line */}
                      <line
                        x1={first.x}
                        y1={first.y - NODE_R - 8}
                        x2={first.x}
                        y2={first.y - NODE_R - 36}
                        stroke="#22c55e"
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                      {/* flag background pill */}
                      <rect
                        x={first.x - 38}
                        y={first.y - NODE_R - 56}
                        width={76}
                        height={22}
                        rx={11}
                        fill="#14532d"
                        stroke="#22c55e"
                        strokeWidth={1.5}
                      />
                      <text
                        x={first.x}
                        y={first.y - NODE_R - 45}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#4ade80"
                        fontSize={11}
                        fontWeight="700"
                        fontFamily="system-ui, sans-serif"
                      >
                        🚩 BẮT ĐẦU
                      </text>
                    </g>
                  )
                })()}

              {/* ── FINISH label above last node */}
              {positions.length > 1 &&
                (() => {
                  const last = positions[positions.length - 1]
                  return (
                    <g key="finish-flag">
                      {/* flag pole line */}
                      <line
                        x1={last.x}
                        y1={last.y - NODE_R - 8}
                        x2={last.x}
                        y2={last.y - NODE_R - 36}
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                      {/* flag background pill */}
                      <rect
                        x={last.x - 40}
                        y={last.y - NODE_R - 56}
                        width={80}
                        height={22}
                        rx={11}
                        fill="#451a03"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                      />
                      <text
                        x={last.x}
                        y={last.y - NODE_R - 45}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#fbbf24"
                        fontSize={11}
                        fontWeight="700"
                        fontFamily="system-ui, sans-serif"
                      >
                        🏆 KẾT THÚC
                      </text>
                    </g>
                  )
                })()}
            </svg>
          )}
        </div>

        {/* hint */}
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <span>ℹ</span>
          Nhấp vào từng bài để xem chi tiết và theo dõi tiến độ.
        </p>

        {/* styles */}
        <style>{`
          .roadmap-node { transition: opacity 0.15s; }
          .roadmap-node:hover { opacity: 0.9; }
          .roadmap-node:hover circle { filter: brightness(1.12); }
        `}</style>
      </div>
    )
  }
)

// ── SingleBadge: one pill badge centred under the node ───────────────────
function SingleBadge({
  x,
  y,
  label,
  bg,
  color,
}: {
  x: number
  y: number
  label: string
  bg: string
  color: string
}) {
  const bw = 58
  const bh = 17
  return (
    <g>
      <rect x={x - bw / 2} y={y} width={bw} height={bh} rx={8.5} fill={bg} />
      <text
        x={x}
        y={y + bh / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={9}
        fontWeight="700"
        fontFamily="system-ui"
      >
        {label}
      </text>
    </g>
  )
}

RoadmapVisualTimeline.displayName = 'RoadmapVisualTimeline'
