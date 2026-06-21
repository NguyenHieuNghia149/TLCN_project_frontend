import React, { useEffect, useRef } from 'react';
import type { RoadmapItem } from '@/types/roadmap.types';

interface RoadmapFlowConnectorProps {
  track1Ref: React.RefObject<HTMLDivElement>;
  track2Ref: React.RefObject<HTMLDivElement>;
  track3Ref: React.RefObject<HTMLDivElement>;
  completedItems: string[];
  allItems: RoadmapItem[];
}

/**
 * RoadmapFlowConnector Component - Draws curved SVG paths between timeline rows
 *
 * Creates flowing connector paths:
 *   - Track 1 → Track 2: Curved path from last node of track1 to first node of track2
 *   - Track 2 → Track 3: Curved path from last node of track2 to first node of track3
 *
 * The paths are animated and colored based on completion state
 */
export const RoadmapFlowConnector = React.memo<RoadmapFlowConnectorProps>(
  ({ track1Ref, track2Ref, track3Ref, completedItems, allItems }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
      const updateConnectors = () => {
        if (!svgRef.current || !track1Ref.current || !track2Ref.current || !track3Ref.current) {
          return;
        }

        const svg = svgRef.current;
        const track1 = track1Ref.current;
        const track2 = track2Ref.current;
        const track3 = track3Ref.current;

        // Clear existing paths
        svg.innerHTML = '';

        // Get positions
        const track2Rect = track2.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        // Calculate relative positions

        // Get rightmost point of track1 and leftmost point of track2
        const track1LastNode = track1.querySelector('[data-testid*="item-node"]:last-of-type');
        const track2FirstNode = track2.querySelector('[data-testid*="item-node"]:first-of-type');
        const track3FirstNode = track3.querySelector('[data-testid*="item-node"]:first-of-type');

        if (!track1LastNode || !track2FirstNode || !track3FirstNode) {
          return;
        }

        const track1LastNodeRect = track1LastNode.getBoundingClientRect();
        const track2FirstNodeRect = track2FirstNode.getBoundingClientRect();
        const track3FirstNodeRect = track3FirstNode.getBoundingClientRect();

        // Curve 1: Track 1 to Track 2
        const x1End = track1LastNodeRect.right - svgRect.left;
        const y1End = track1LastNodeRect.top - svgRect.top + track1LastNodeRect.height / 2;

        const x2Start = track2FirstNodeRect.left - svgRect.left;
        const y2Start = track2FirstNodeRect.top - svgRect.top + track2FirstNodeRect.height / 2;

        const path1 = createCurvedPath(x1End, y1End, x2Start, y2Start);
        const isCompleted1 = completedItems.length > allItems.length / 3;
        drawPath(svg, path1, isCompleted1 ? 'url(#gradientCompleted)' : 'url(#gradientPending)', isCompleted1);

        // Curve 2: Track 2 to Track 3
        const x2End = track2.getBoundingClientRect().right - svgRect.left;
        const y2End = track2Rect.top - svgRect.top + track2Rect.height / 2;

        const x3Start = track3FirstNodeRect.left - svgRect.left;
        const y3Start = track3FirstNodeRect.top - svgRect.top + track3FirstNodeRect.height / 2;

        const path2 = createCurvedPath(x2End, y2End, x3Start, y3Start);
        const isCompleted2 = completedItems.length > (allItems.length * 2) / 3;
        drawPath(svg, path2, isCompleted2 ? 'url(#gradientCompleted)' : 'url(#gradientPending)', isCompleted2);
      };

      updateConnectors();
      window.addEventListener('resize', updateConnectors);

      return () => {
        window.removeEventListener('resize', updateConnectors);
      };
    }, [track1Ref, track2Ref, track3Ref, completedItems, allItems.length]);

    return (
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
        preserveAspectRatio="none"
      >
        {/* Gradients for animated paths */}
        <defs>
          {/* Completed gradient - green */}
          <linearGradient id="gradientCompleted" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.8" />
          </linearGradient>

          {/* Pending gradient - slate */}
          <linearGradient id="gradientPending" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.5" />
          </linearGradient>

          {/* Arrow marker for completed */}
          <marker
            id="arrowCompleted"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#22c55e" />
          </marker>

          {/* Arrow marker for pending */}
          <marker
            id="arrowPending"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#cbd5e1" />
          </marker>
        </defs>
      </svg>
    );
  }
);

/**
 * Create a curved path using quadratic Bézier curves
 * Creates a smooth S-curve between two points
 */
function createCurvedPath(x1: number, y1: number, x2: number, y2: number): string {
  const midX = (x1 + x2) / 2;

  // Control points create the S-curve effect
  const cp1x = x1 + (midX - x1) * 0.3;
  const cp1y = y1;
  const cp2x = x2 - (x2 - midX) * 0.3;
  const cp2y = y2;

  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

/**
 * Draw a path on the SVG
 */
function drawPath(svg: SVGSVGElement, path: string, fill: string, isCompleted: boolean): void {
  const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pathElement.setAttribute('d', path);
  pathElement.setAttribute('stroke', isCompleted ? '#22c55e' : '#cbd5e1');
  pathElement.setAttribute('stroke-width', '4');
  pathElement.setAttribute('fill', 'none');
  pathElement.setAttribute('stroke-linecap', 'round');
  pathElement.setAttribute('stroke-linejoin', 'round');

  if (isCompleted) {
    pathElement.classList.add('animated-dash');
  }

  svg.appendChild(pathElement);
}

RoadmapFlowConnector.displayName = 'RoadmapFlowConnector';
