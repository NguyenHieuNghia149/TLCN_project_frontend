export interface RankingUser {
  id: string
  rank: number
  firstName: string
  lastName: string
  email: string
  avatar: string | null
  acceptedProblems: number
  totalSubmissions: number
  successRate: number
  rankingPoint?: number // Points earned from submissions
  createdAt: string
}

export interface RankingResponse {
  success: boolean
  data: RankingUser[]
  message: string
}

export interface RankingFilters {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'acceptedProblems' | 'successRate' | 'totalSubmissions'
  sortOrder?: 'asc' | 'desc'
}
