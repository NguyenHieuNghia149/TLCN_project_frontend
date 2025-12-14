export enum ENotificationType {
  NEW_EXAM = 'NEW_EXAM',
  SYSTEM = 'SYSTEM',
  SUBMISSION = 'SUBMISSION',
  COMMENT = 'COMMENT',
}

export interface Notification {
  id: string
  userId: string
  type: ENotificationType
  title: string
  message: string
  metadata?: Record<string, unknown>
  isRead: boolean
  createdAt: string
}

export interface NotificationResponse {
  data: {
    notifications: Notification[]
    unreadCount: number
  }
  message: string
}
