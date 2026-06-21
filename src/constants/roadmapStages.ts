import React from 'react'
import {
  FiPlay,
  FiBriefcase,
  FiSearch,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiBox,
  FiAward,
} from 'react-icons/fi'
import type { TimelineVisualizationData } from '@/types/roadmap.types'

/**
 * Global Stage Index Order (0-indexed):
 *   0: START (progress track, index 0)
 *   1: IDEA (progress track, index 1)
 *   2: RESEARCH (progress track, index 2)
 *   3: MARKET (progress track, index 3)
 *   4: BUDGET (milestone track, local index 0)
 *   5: PARTNERS (milestone track, local index 1)
 *   6: PRODUCT (milestone track, local index 2)
 *   7: FINISH (milestone track, local index 3)
 */

/**
 * Icon component map (mandatory - runtime lookup via string key)
 * Reason: Serializable to database, no ES module dependency, easier to mock in tests
 */
export const ICON_COMPONENT_MAP: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  play: FiPlay,
  briefcase: FiBriefcase, // Feather Icons substitute for 'idea' concept
  search: FiSearch,
  'trending-up': FiTrendingUp,
  'dollar-sign': FiDollarSign,
  users: FiUsers, // Feather Icons substitute for 'handshake'
  box: FiBox, // Feather Icons substitute for 'package'
  award: FiAward,
}

/**
 * Helper function to resolve icon component from string key
 * Returns null if icon key not found
 */
export const getIconComponent = (
  iconKey?: string
): React.ComponentType<React.SVGProps<SVGSVGElement>> | null => {
  if (!iconKey) return null
  return ICON_COMPONENT_MAP[iconKey] ?? null
}

/**
 * Default timeline stages configuration
 * Used in RoadmapVisualTimeline component when visualization prop is not provided
 */
export const DEFAULT_TIMELINE_STAGES: TimelineVisualizationData = {
  progressStages: [
    {
      id: 'start',
      label: 'START',
      description: 'Begin your learning journey',
      icon: 'play',
      order: 0,
      track: 'progress',
    },
    {
      id: 'idea',
      label: 'IDEA',
      description: 'Validate the problem and brainstorm innovative solutions.',
      icon: 'briefcase',
      order: 1,
      track: 'progress',
    },
    {
      id: 'research',
      label: 'RESEARCH',
      description: 'Conduct market research and analyze user needs thoroughly.',
      icon: 'search',
      order: 2,
      track: 'progress',
    },
    {
      id: 'market',
      label: 'MARKET',
      description: 'Test in the market and validate product-market fit.',
      icon: 'trending-up',
      order: 3,
      track: 'progress',
    },
  ],
  milestoneStages: [
    {
      id: 'budget',
      label: 'BUDGET',
      description: 'Allocate resources and manage budget efficiently.',
      icon: 'dollar-sign',
      order: 0,
      track: 'milestone',
    },
    {
      id: 'partners',
      label: 'PARTNERS',
      description: 'Collaborate with the right partners and build synergy.',
      icon: 'users',
      order: 1,
      track: 'milestone',
    },
    {
      id: 'product',
      label: 'PRODUCT',
      description: 'Build, iterate and deliver an exceptional product.',
      icon: 'box',
      order: 2,
      track: 'milestone',
    },
    {
      id: 'finish',
      label: 'FINISH',
      description: 'Success - you have completed your journey!',
      icon: 'award',
      order: 3,
      track: 'milestone',
    },
  ],
}

/**
 * Get stage label by global index (0-7)
 */
export const getStageLabel = (globalIndex: number): string => {
  const allStages = [
    ...DEFAULT_TIMELINE_STAGES.progressStages,
    ...DEFAULT_TIMELINE_STAGES.milestoneStages,
  ]
  return allStages[globalIndex]?.label ?? ''
}

/**
 * Get default icon by item type (lesson, problem)
 * Used when RoadmapItem doesn't have custom icon
 */
export const getIconByItemType = (itemType: 'lesson' | 'problem'): string => {
  return itemType === 'lesson' ? 'briefcase' : 'search'
}
