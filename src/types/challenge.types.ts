export interface Challenge {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  createdAt: string
  updatedAt?: string
  totalPoints?: number

  /** Trạng thái người dùng */
  isSolve: boolean
  isFavorite: boolean
}
