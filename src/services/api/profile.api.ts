import { apiClient } from '../../config/axios.config'
import type { ProfileResponse, UpdateProfileData } from '@/types/profile.types'

class ProfileAPI {
  async getProfile(userId?: string): Promise<ProfileResponse> {
    const endpoint = userId ? `/profile/${userId}` : '/profile/me'
    const response = await apiClient.get<ProfileResponse>(endpoint)
    return response.data
  }

  async updateProfile(data: UpdateProfileData): Promise<ProfileResponse> {
    const response = await apiClient.put<ProfileResponse>('/profile/me', data)
    return response.data
  }
}

export const profileAPI = new ProfileAPI()
