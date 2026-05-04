export interface RoadmapItem {
  id: string
  roadmapId: string
  itemType: 'lesson' | 'problem'
  itemId: string
  itemTitle?: string
  order: number
  createdAt: string
  updatedAt: string
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
  items: RoadmapItem[]
}

export interface ProgressStats {
  total: number
  completed: number
  percentage: number
  completedItems: string[]
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
