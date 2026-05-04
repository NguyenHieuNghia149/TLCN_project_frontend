import { apiClient } from '@/config/axios.config'

export interface BannedByAdmin {
  name: string
}

export interface BannedUser {
  id: string
  name: string
  email: string
  ban_reason: string
  banned_at: string
  bannedByAdmin?: BannedByAdmin | null
}

export interface BanUserResponse {
  success: boolean
  userId: string
  status: 'banned'
  bannedAt: Date
  message: string
}

export interface UnbanUserResponse {
  success: boolean
  userId: string
  status: 'active'
  message: string
}

export interface BannedListResponse {
  users: BannedUser[]
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

interface ApiErrorResponse {
  error?: {
    message?: string
  }
}

interface ApiResult<TData> {
  success: boolean
  data: TData
  error: ApiErrorResponse | null
}

export const adminService = {
  /**
   * Ban a user
   */
  async banUser(
    userId: string,
    reason: string
  ): Promise<ApiResult<BanUserResponse>> {
    return apiClient.post(`/admin/users/${userId}/ban`, { reason })
  },

  /**
   * Unban a user
   */
  async unbanUser(userId: string): Promise<ApiResult<UnbanUserResponse>> {
    return apiClient.post(`/admin/users/${userId}/unban`)
  },

  /**
   * Get list of banned users with pagination
   */
  async listBannedUsers(
    limit: number = 20,
    offset: number = 0
  ): Promise<ApiResult<BannedListResponse>> {
    return apiClient.get(`/admin/users/banned`, {
      params: { limit, offset },
    })
  },

  /**
   * Get list of active users for banning
   */
  async listActiveUsers(): Promise<ApiResult<{ users: BannedUser[] }>> {
    return apiClient.get(`/admin/users/active`)
  },
}

export default adminService
