import { apiClient } from '../../config/axios.config'

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

class ProfileAPI {
  async getProfile(userId?: string): Promise<ProfileResponse> {
    const endpoint = userId ? `/auth/profile/${userId}` : '/auth/me'
    const response = await apiClient.get<ProfileResponse>(endpoint)
    return response.data
  }

  async updateProfile(data: UpdateProfileData): Promise<ProfileResponse> {
    const response = await apiClient.put<ProfileResponse>('/auth/profile', data)
    return response.data
  }
}

export const profileAPI = new ProfileAPI()
