import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { Roadmap, ProgressStats, RoadmapItem } from '@/types/roadmap.types';

interface RoadmapVisualTimelineProps {
  roadmap: Roadmap;
  items: RoadmapItem[];
  progress: ProgressStats;
  onItemClick?: (itemId: string) => void;
  className?: string;
}

/** Number of items per row in the snake layout */
const ITEMS_PER_ROW = 4;
/** Horizontal spacing between node centers */
const NODE_SPACING_X = 220;
/** Vertical spacing between rows */
const ROW_HEIGHT = 200;
/** Road stroke width */
const ROAD_WIDTH = 8;
/** Node circle radius */
const NODE_RADIUS = 36;
/** Padding from edges */
const PADDING_X = 80;
const PADDING_Y = 80;

/**
 * RoadmapVisualTimeline Component - Snake-like flowing road visualization
 *
 * Creates a winding road path where:
 *   - Completed segments are filled GREEN
 *   - Pending segments are GRAY
 *   - Nodes sit on top of the road with clear visual states
 */
export const RoadmapVisualTimeline = React.memo<RoadmapVisualTimelineProps>(
  ({
    roadmap,
    items,
    progress,
    onItemClick,
    className = '',
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Sort items by order
    const sortedItems = useMemo(() => {
      return [...items].sort((a, b) => a.order - b.order);
    }, [items]);

    // Calculate responsive node spacing
    useEffect(() => {
      const updateWidth = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth);
        }
      };
      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // Calculate dynamic spacing based on container width
    const dynamicSpacingX = useMemo(() => {
      if (containerWidth === 0) return NODE_SPACING_X;
      const itemsInRow = Math.min(ITEMS_PER_ROW, sortedItems.length);
      const availableWidth = containerWidth - PADDING_X * 2;
      const spacing = availableWidth / Math.max(itemsInRow - 1, 1);
      return Math.max(150, Math.min(spacing, NODE_SPACING_X));
    }, [containerWidth, sortedItems.length]);

    // Calculate node positions in a snake pattern
    const nodePositions = useMemo(() => {
      const positions: { x: number; y: number; item: RoadmapItem }[] = [];
      const itemsPerRow = Math.min(ITEMS_PER_ROW, Math.max(2, Math.floor((containerWidth - PADDING_X * 2) / 150) + 1));

      // Calculate centering offset
      const actualItemsInRow = Math.min(itemsPerRow, sortedItems.length);
      const rowWidth = Math.max(0, actualItemsInRow - 1) * dynamicSpacingX;
      // Centering offset: containerWidth - rowWidth, divided by 2
      const offsetX = Math.max(PADDING_X, (containerWidth - rowWidth) / 2);

      sortedItems.forEach((item, index) => {
        const row = Math.floor(index / itemsPerRow);
        const colIndex = index % itemsPerRow;
        const isReversedRow = row % 2 === 1;

        const col = isReversedRow ? (itemsPerRow - 1 - colIndex) : colIndex;
        const x = offsetX + col * dynamicSpacingX;
        const y = PADDING_Y + row * ROW_HEIGHT;

        positions.push({ x, y, item });
      });

      return positions;
    }, [sortedItems, dynamicSpacingX, containerWidth]);

    // Calculate SVG dimensions
    const svgDimensions = useMemo(() => {
      if (nodePositions.length === 0) return { width: 0, height: 0 };
      const maxX = Math.max(...nodePositions.map(p => p.x));
      const maxY = Math.max(...nodePositions.map(p => p.y));
      return {
        width: maxX + PADDING_X,
        height: maxY + PADDING_Y + 40,
      };
    }, [nodePositions]);

    // Build road path segments
    const roadSegments = useMemo(() => {
      const segments: { path: string; isCompleted: boolean }[] = [];

      for (let i = 0; i < nodePositions.length - 1; i++) {
        const from = nodePositions[i];
        const to = nodePositions[i + 1];
        const fromCompleted = progress.completedItems.includes(from.item.id);
        const toCompleted = progress.completedItems.includes(to.item.id);
        // A segment is completed if the starting node is completed
        const isCompleted = fromCompleted && toCompleted;

        // Check if this is a turn (row change) or straight
        if (Math.abs(from.y - to.y) > 10) {
          // Vertical curve between rows
          const midY = (from.y + to.y) / 2;
          const path = `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
          segments.push({ path, isCompleted });
        } else {
          // Horizontal line within same row
          const path = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
          segments.push({ path, isCompleted });
        }
      }

      return segments;
    }, [nodePositions, progress.completedItems]);

    // Progress percentage
    const progressPercentage = progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

    const handleItemClick = useCallback((itemId: string) => {
      onItemClick?.(itemId);
    }, [onItemClick]);

    if (sortedItems.length === 0) {
      return (
        <div className={`flex items-center justify-center py-16 text-slate-400 ${className}`}>
          <p className="text-lg">No items in this roadmap yet.</p>
        </div>
      );
    }

    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{roadmap.title}</h2>
          {roadmap.description && (
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{roadmap.description}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Progress</span>
            </div>
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {progress.completed}/{progress.total} completed
              <span className="ml-2 text-green-600 dark:text-green-500 font-bold">({progressPercentage}%)</span>
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progressPercentage}%`,
                background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
              }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Screen Reader Announcement */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {`Timeline progress: ${progress.completed} of ${progress.total} items completed.`}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-1.5 rounded-full bg-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Not started</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-600 dark:border-green-400" />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-500" />
            <span>Pending</span>
          </div>
        </div>

        {/* Road Visualization */}
        <div
          ref={containerRef}
          className="relative overflow-x-auto rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm"
          data-testid="timeline-snake"
        >
          {containerWidth > 0 && (
            <svg
              width={svgDimensions.width}
              height={svgDimensions.height}
              className="block min-w-full"
              style={{ minWidth: svgDimensions.width }}
            >
              <defs>
                {/* Glow filter for completed segments */}
                <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Shadow for nodes */}
                <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.1" />
                </filter>
                {/* Gradient for completed road */}
                <linearGradient id="road-completed" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
                {/* Gradient for pending road */}
                <linearGradient id="road-pending" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
              </defs>

              {/* Road background (thicker, lighter) */}
              {roadSegments.map((seg, i) => (
                <path
                  key={`road-bg-${i}`}
                  d={seg.path}
                  className={seg.isCompleted ? 'stroke-green-100 dark:stroke-green-900/30' : 'stroke-slate-100 dark:stroke-slate-800'}
                  strokeWidth={ROAD_WIDTH + 8}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {/* Road path segments */}
              {roadSegments.map((seg, i) => (
                <path
                  key={`road-${i}`}
                  d={seg.path}
                  className={seg.isCompleted ? 'stroke-green-500 roadmap-completed-segment' : 'stroke-slate-300 dark:stroke-slate-600'}
                  strokeWidth={ROAD_WIDTH}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={seg.isCompleted ? 'url(#glow-green)' : undefined}
                />
              ))}

              {/* Road dashes for pending segments */}
              {roadSegments.map((seg, i) =>
                !seg.isCompleted ? (
                  <path
                    key={`road-dash-${i}`}
                    d={seg.path}
                    className="stroke-slate-200 dark:stroke-slate-700"
                    strokeWidth={2}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="8 8"
                  />
                ) : null
              )}

              {/* Direction arrows on road */}
              {roadSegments.map((seg, i) => {
                const from = nodePositions[i];
                const to = nodePositions[i + 1];
                if (!from || !to) return null;
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                const angle = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
                return (
                  <g key={`arrow-${i}`} transform={`translate(${midX},${midY}) rotate(${angle})`}>
                    <polygon
                      points="-6,-4 6,0 -6,4"
                      className={seg.isCompleted ? 'fill-green-600 dark:fill-green-500' : 'fill-slate-400 dark:fill-slate-500'}
                      opacity={0.6}
                    />
                  </g>
                );
              })}

              {/* Node circles */}
              {nodePositions.map(({ x, y, item }) => {
                const isCompleted = progress.completedItems.includes(item.id);

                return (
                  <g
                    key={item.id}
                    className="roadmap-node cursor-pointer"
                    onClick={() => handleItemClick(item.id)}
                    data-testid={`item-node-${item.id}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.itemTitle || item.itemType} - ${isCompleted ? 'completed' : 'pending'}`}
                  >
                    {/* Outer ring for active/current items */}
                    {!isCompleted && (
                      <circle
                        cx={x}
                        cy={y}
                        r={NODE_RADIUS + 4}
                        fill="none"
                        className="stroke-slate-200 dark:stroke-slate-700 roadmap-pending-ring"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Completion glow ring */}
                    {isCompleted && (
                      <circle
                        cx={x}
                        cy={y}
                        r={NODE_RADIUS + 6}
                        fill="none"
                        className="stroke-green-500"
                        strokeWidth={2}
                        opacity={0.3}
                      />
                    )}

                    {/* Main node circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={NODE_RADIUS}
                      className={isCompleted ? 'fill-green-500 stroke-green-600 dark:stroke-green-400' : 'fill-white dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-600'}
                      strokeWidth={3}
                      filter="url(#node-shadow)"
                    />

                    {/* Inner circle decoration */}
                    <circle
                      cx={x}
                      cy={y}
                      r={NODE_RADIUS - 6}
                      fill="none"
                      className={isCompleted ? 'stroke-white/30' : 'stroke-black/5 dark:stroke-white/5'}
                      strokeWidth={1}
                    />

                    {/* Icon or check mark */}
                    {isCompleted ? (
                      <>
                        {/* Large check mark for completed */}
                        <text
                          x={x}
                          y={y + 1}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="fill-white"
                          fontSize="22"
                          fontWeight="bold"
                          fontFamily="system-ui"
                        >
                          ✓
                        </text>
                      </>
                    ) : (
                      <>
                        {/* Item type icon for pending */}
                        <text
                          x={x}
                          y={y + 1}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className="fill-slate-500 dark:fill-slate-400"
                          fontSize="18"
                          fontFamily="system-ui"
                        >
                          {item.itemType === 'lesson' ? '📖' : '💻'}
                        </text>
                      </>
                    )}

                    {/* Order badge */}
                    <g>
                      <circle
                        cx={x + NODE_RADIUS - 4}
                        cy={y - NODE_RADIUS + 4}
                        r={12}
                        className={isCompleted ? 'fill-green-600 stroke-white dark:stroke-slate-900' : 'fill-slate-500 dark:fill-slate-600 stroke-white dark:stroke-slate-900'}
                        strokeWidth={2}
                      />
                      <text
                        x={x + NODE_RADIUS - 4}
                        y={y - NODE_RADIUS + 5}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-white"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="system-ui"
                      >
                        {item.order}
                      </text>
                    </g>

                    {/* Label below node */}
                    <text
                      x={x}
                      y={y + NODE_RADIUS + 20}
                      textAnchor="middle"
                      dominantBaseline="hanging"
                      className={isCompleted ? 'fill-green-700 dark:fill-green-400' : 'fill-slate-600 dark:fill-slate-300'}
                      fontSize="12"
                      fontWeight="600"
                      fontFamily="system-ui, -apple-system, sans-serif"
                      style={{ transition: 'font-weight 0.2s' }}
                    >
                      {truncateLabel(item.itemTitle || item.itemType, 18)}
                    </text>

                    {/* Item type tag */}
                    <g>
                      <rect
                        x={x - 22}
                        y={y + NODE_RADIUS + 38}
                        width={44}
                        height={18}
                        rx={9}
                        className={item.itemType === 'lesson' ? 'fill-blue-100 dark:fill-blue-900/40' : 'fill-amber-100 dark:fill-amber-900/40'}
                      />
                      <text
                        x={x}
                        y={y + NODE_RADIUS + 47}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className={item.itemType === 'lesson' ? 'fill-blue-600 dark:fill-blue-400' : 'fill-amber-600 dark:fill-amber-500'}
                        fontSize="9"
                        fontWeight="600"
                        fontFamily="system-ui"
                      >
                        {item.itemType === 'lesson' ? 'LESSON' : 'PROBLEM'}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Start flag */}
              {nodePositions.length > 0 && (
                <g>
                  <text
                    x={nodePositions[0].x}
                    y={nodePositions[0].y - NODE_RADIUS - 16}
                    textAnchor="middle"
                    className="fill-green-600 dark:fill-green-400"
                    fontSize="14"
                    fontWeight="bold"
                    fontFamily="system-ui"
                  >
                    🚩 START
                  </text>
                </g>
              )}

              {/* Finish flag */}
              {nodePositions.length > 1 && (
                <g>
                  <text
                    x={nodePositions[nodePositions.length - 1].x}
                    y={nodePositions[nodePositions.length - 1].y - NODE_RADIUS - 16}
                    textAnchor="middle"
                    className="fill-indigo-500 dark:fill-indigo-400"
                    fontSize="14"
                    fontWeight="bold"
                    fontFamily="system-ui"
                  >
                    🏁 FINISH
                  </text>
                </g>
              )}
            </svg>
          )}
        </div>

        {/* CSS animations */}
        <style>{`
          .roadmap-node {
            transition: transform 0.2s ease;
          }
          .roadmap-node:hover {
            filter: brightness(1.1);
          }
          .roadmap-node:hover .roadmap-node-label {
            font-weight: 700;
          }
          .roadmap-completed-segment {
            animation: roadmap-pulse 3s ease-in-out infinite;
          }
          .roadmap-pending-ring {
            animation: roadmap-dash-rotate 8s linear infinite;
          }
          @keyframes roadmap-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.85; }
          }
          @keyframes roadmap-dash-rotate {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: 50; }
          }
          @media (prefers-reduced-motion: reduce) {
            .roadmap-completed-segment,
            .roadmap-pending-ring {
              animation: none;
            }
          }
        `}</style>
      </div>
    );
  }
);

/** Truncate long labels for node display */
function truncateLabel(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 1) + '…';
}

RoadmapVisualTimeline.displayName = 'RoadmapVisualTimeline';
