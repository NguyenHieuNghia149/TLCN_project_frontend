import React, { useMemo } from 'react';
import { StageNode } from './StageNode';
import { getIconByItemType } from '@/constants/roadmapStages';
import type { RoadmapItem } from '@/types/roadmap.types';

interface TimelineTrackProps {
  trackId: string;
  items: RoadmapItem[];
  completedItemIds: string[];
  direction: 'ltr' | 'rtl'; // left-to-right or right-to-left
  onItemClick?: (itemId: string) => void;
  className?: string;
}

/**
 * TimelineTrack Component - Single row of timeline items
 *
 * Renders roadmap items as timeline nodes with flow connectors
 * Supports both left-to-right and right-to-left display (for snake pattern)
 *
 * Props:
 *   - trackId: Unique identifier for track (track1, track2, track3)
 *   - items: RoadmapItem[] (already sorted by order)
 *   - completedItemIds: String[] of completed item IDs
 *   - direction: 'ltr' for left→right, 'rtl' for right→left display
 *   - onItemClick: Callback when item node clicked
 */
export const TimelineTrack = React.memo<TimelineTrackProps>(
  ({
    trackId,
    items,
    completedItemIds,
    direction,
    onItemClick,
    className = '',
  }) => {
    // Reverse items for RTL display (but keep their internal data intact)
    const displayItems = useMemo(() => {
      if (direction === 'rtl') {
        return [...items].reverse();
      }
      return items;
    }, [items, direction]);

    const handleItemClick = (itemId: string) => {
      onItemClick?.(itemId);
    };

    if (displayItems.length === 0) {
      return (
        <div className={`flex items-center justify-center py-8 text-slate-400 text-sm ${className}`}>
          No items
        </div>
      );
    }

    return (
      <div
        className={`
          flex items-center justify-start
          gap-3 sm:gap-4 md:gap-5 lg:gap-6
          px-4 py-6
          overflow-x-auto
          ${direction === 'rtl' ? 'flex-row-reverse' : ''}
          ${className}
        `}
        data-testid={`timeline-track-${trackId}`}
      >
        {displayItems.map((item, localIndex) => {
          const isCompleted = completedItemIds.includes(item.id);
          const iconKey = item.icon || getIconByItemType(item.itemType);

          // Assign color based on item order within the entire roadmap
          const colorClass = getNodeColorClass(item.order);

          return (
            <div
              key={item.id}
              className="flex items-center flex-shrink-0 relative"
            >
              {/* Node */}
              <StageNode
                id={item.id}
                label={item.itemTitle || `${item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)}`}
                description={`${item.itemType} #${item.order}`}
                icon={iconKey}
                isCompleted={isCompleted}
                isCurrent={false}
                isActive={isCompleted}
                onClick={() => handleItemClick(item.id)}
                colorClass={colorClass}
                data-testid={`item-node-${item.id}`}
              />

              {/* Connecting Line (except last item) */}
              {localIndex < displayItems.length - 1 && (
                <div
                  className={`
                    h-1 flex-shrink-0
                    bg-gradient-to-r from-slate-300 to-slate-200
                    ${isCompleted ? 'from-green-400 to-green-300' : ''}
                  `}
                  style={{ width: '24px' }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

/**
 * Get node background color class based on item order
 * Creates rainbow-like progression matching the design
 */
function getNodeColorClass(order: number): string {
  const colors = [
    'bg-red-400',      // 1
    'bg-blue-400',     // 2
    'bg-orange-400',   // 3
    'bg-teal-400',     // 4
    'bg-purple-400',   // 5
    'bg-green-500',    // 6
    'bg-pink-400',     // 7
    'bg-cyan-400',     // 8
    'bg-rose-400',     // 9
  ];
  return colors[(order - 1) % colors.length];
}

TimelineTrack.displayName = 'TimelineTrack';
