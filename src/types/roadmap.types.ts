export interface RoadmapItem {
  id: string
  roadmapId: string
  itemType: 'lesson' | 'problem'
  itemId: string
  itemTitle?: string
  order: number
  icon?: string // Icon key for timeline display (optional, defaults by itemType)
  createdAt: string
  updatedAt: string
}

/**
 * R14.1: Extended RoadmapItem with lock status information
 * Used when displaying items with sequential unlocking constraints
 * Frontend receives this from backend when calling getRoadmapDetail
 */
export interface RoadmapItemWithLockStatus extends RoadmapItem {
  isCompleted: boolean // User has finished this item
  isUnlocked: boolean // Item is available to start (prerequisites met)
  lockReason?: string | null // If locked, why? (e.g., "Complete Item 1 first")
}

export interface Roadmap {
  id: string
  title: string
  description: string | null
  createdBy: string
  visibility: 'public' | 'private'
  createdAt: string
  updatedAt: string
}

export interface RoadmapDetail {
  roadmap: Roadmap
  items: RoadmapItem[] | RoadmapItemWithLockStatus[]
}

export interface ProgressStats {
  total: number
  completed: number
  percentage: number
  completedItems: string[]
  currentStageIndex?: number // 0-7 global index: progress (0-3) + milestone (4-7)
}

export interface StageConfig {
  id: string
  label: string // e.g., "IDEA", "RESEARCH"
  description: string
  icon?: string // string key for ICON_COMPONENT_MAP lookup
  order: number
  track: 'progress' | 'milestone' // top or bottom row
}

export interface TimelineVisualizationData {
  progressStages: StageConfig[] // Top row: START → IDEA → RESEARCH → MARKET
  milestoneStages: StageConfig[] // Bottom row: BUDGET → PARTNERS → PRODUCT → FINISH
}

export interface CreateRoadmapDto {
  title: string
  description?: string
  visibility?: 'public' | 'private'
}

export interface AddItemDto {
  itemType: 'lesson' | 'problem'
  itemId: string
}

export interface ApiEnvelope<T> {
  success: boolean
  data: T
  error: { code: string; message: string; details?: unknown } | null
}
