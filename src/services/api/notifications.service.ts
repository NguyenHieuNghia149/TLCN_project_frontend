import { apiClient } from '@/config/axios.config'
import { AxiosError } from 'axios'
import { NotificationResponse } from '@/types/notification.types'

export const notificationService = {
  getMyNotifications: async (limit: number = 20, offset: number = 0) => {
    try {
      const response = await apiClient.get<NotificationResponse>(
        '/notifications',
        {
          params: { limit, offset },
        }
      )
      return response.data.data || response.data
    } catch (error) {
      const axiosError = error as AxiosError
      if (axiosError.response?.status === 401) {
        return { notifications: [], unreadCount: 0 }
      }
      console.error('Failed to fetch notifications', error)
      return { notifications: [], unreadCount: 0 }
    }
  },

  markAsRead: async (id: string) => {
    return apiClient.patch(`/notifications/${id}/read`)
  },

  markAllAsRead: async () => {
    return apiClient.patch('/notifications/read-all')
  },
}
