import React, { useEffect, useRef, useState } from 'react';

interface ConnectorLineProps {
  isCompleted: boolean;
  isActive: boolean;
  position: 'horizontal' | 'curved';
  length?: number;
  progressTrackRef?: React.RefObject<HTMLDivElement | null>;
  milestoneTrackRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * ConnectorLine Component - SVG-based connector between stages
 *
 * Two rendering modes:
 *   - horizontal: Simple line between nodes in same track
 *   - curved: Bézier curve from end of progress track to start of milestone track
 *
 * Styling:
 *   - Completed: stroke-green-400, stroke-width 2
 *   - Active: stroke-blue-400, stroke-width 2.5 with animated dash
 *   - Default: stroke-slate-300, stroke-width 2
 *   - Animation: dash animation 1.5s infinite linear if active
 *
 * Lifecycle (curved mode):
 *   - useEffect calculates initial path from getBoundingClientRect()
 *   - Setup ResizeObserver to observe track refs
 *   - Recalculate path when size changes
 *   - CLEANUP: observer.disconnect() in useEffect return function (prevent memory leak)
 */
export const ConnectorLine = React.memo<ConnectorLineProps>(
  ({
    isCompleted,
    isActive,
    position,
    length = 64,
    progressTrackRef,
    milestoneTrackRef,
  }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [curvedPath, setCurvedPath] = useState<string>('');

    // Calculate curved path from progress track end to milestone track start
    useEffect(() => {
      if (position !== 'curved' || !progressTrackRef?.current || !milestoneTrackRef?.current) {
        return;
      }

      const calculatePath = () => {
        const progressRect = progressTrackRef.current?.getBoundingClientRect();
        const milestoneRect = milestoneTrackRef.current?.getBoundingClientRect();

        if (!progressRect || !milestoneRect) return;

        // Calculate connection points
        // From right edge of progress track to left edge of milestone track
        const startX = progressRect.right;
        const startY = progressRect.top + progressRect.height / 2;
        const endX = milestoneRect.left;
        const endY = milestoneRect.top + milestoneRect.height / 2;

        // Calculate control point for smooth curve
        const controlX = (startX + endX) / 2;
        const controlY = Math.min(startY, endY) - 50; // Curve upward

        // Create SVG path using quadratic Bézier curve
        const path = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
        setCurvedPath(path);
      };

      calculatePath();

      // Setup ResizeObserver to recalculate on size changes
      const observer = new ResizeObserver(calculatePath);
      observer.observe(progressTrackRef.current);
      observer.observe(milestoneTrackRef.current);
      window.addEventListener('resize', calculatePath);

      // Cleanup: disconnect observer and remove listener
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', calculatePath);
      };
    }, [position, progressTrackRef, milestoneTrackRef]);

    // Determine stroke color based on state
    const getStrokeColor = (): string => {
      if (isCompleted) return '#4ade80'; // green-400
      if (isActive) return '#3b82f6'; // blue-400
      return '#cbd5e1'; // slate-300
    };

    const getStrokeWidth = (): number => {
      if (isActive) return 3;
      return 2;
    };

    // Horizontal line between nodes
    if (position === 'horizontal') {
      return (
        <svg
          className="absolute top-1/2 transform -translate-y-1/2"
          width={length}
          height="4"
          style={{ left: '20px' }}
        >
          <line
            x1="0"
            y1="2"
            x2={length}
            y2="2"
            stroke={getStrokeColor()}
            strokeWidth={getStrokeWidth()}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isActive ? 'animate-pulse' : ''}
          />
        </svg>
      );
    }

    // Curved connector between tracks
    if (position === 'curved' && curvedPath) {
      return (
        <svg
          ref={svgRef}
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%', zIndex: 2 }}
          preserveAspectRatio="none"
        >
          <style>{`
            @keyframes dash {
              from { stroke-dashoffset: 0; }
              to { stroke-dashoffset: -1000; }
            }
            .animated-dash {
              animation: dash 1.5s infinite linear;
              stroke-dasharray: 5, 5;
            }
          `}</style>
          <path
            d={curvedPath}
            stroke={getStrokeColor()}
            strokeWidth={getStrokeWidth()}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isActive ? 'animated-dash' : ''}
          />
        </svg>
      );
    }

    return null;
  }
);

ConnectorLine.displayName = 'ConnectorLine';
