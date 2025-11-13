export interface ProfileStatistics {
  totalSubmissions: number
  acceptedSubmissions: number
  wrongAnswerSubmissions: number
  timeLimitExceededSubmissions: number
  memoryLimitExceededSubmissions: number
  runtimeErrorSubmissions: number
  compilationErrorSubmissions: number
  totalProblemsSolved: number
  totalProblemsAttempted: number
  acceptanceRate: number
}

export interface ProfileData {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  avatar: string | null
  gender: string | null
  dateOfBirth: string | null
  role: string
  status: string
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  statistics: ProfileStatistics
}

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  avatar?: string
  gender?: 'male' | 'female' | 'other'
  dateOfBirth?: string
}

export interface ProfileResponse {
  success: boolean
  data: ProfileData
  message?: string
}
