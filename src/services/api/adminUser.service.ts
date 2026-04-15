import { apiClient } from '@/config/axios.config'

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
  users: Record<string, unknown>[]
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

export const adminService = {
  /**
   * Ban a user
   */
  async banUser(
    userId: string,
    reason: string
  ): Promise<{ success: boolean; data: BanUserResponse; error: unknown }> {
    return apiClient.post(`/admin/users/${userId}/ban`, { reason })
  },

  /**
   * Unban a user
   */
  async unbanUser(
    userId: string
  ): Promise<{ success: boolean; data: UnbanUserResponse; error: unknown }> {
    return apiClient.post(`/admin/users/${userId}/unban`)
  },

  /**
   * Get list of banned users with pagination
   */
  async listBannedUsers(
    limit: number = 20,
    offset: number = 0
  ): Promise<{ success: boolean; data: BannedListResponse; error: unknown }> {
    return apiClient.get(`/admin/users/banned`, {
      params: { limit, offset },
    })
  },

  /**
   * Get list of active users for banning
   */
  async listActiveUsers(): Promise<{
    success: boolean
    data: { users: Record<string, unknown>[] }
    error: unknown
  }> {
    return apiClient.get(`/admin/users/active`)
  },
}

export default adminService
