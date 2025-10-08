// src/types/challenge.type.ts
export interface Challenge {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  createdAt: string
  updatedAt?: string
  maxScore?: number

  /** Trạng thái người dùng */
  isSolve: boolean
  isFavorite: boolean
}
