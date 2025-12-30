import React, { useEffect, useState, useRef } from 'react'
import { Bell, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { io, Socket } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

import { useAuth } from '@/hooks/api/useAuth'
import { notificationService } from '@/services/api/notifications.service'
import { ENotificationType, Notification } from '@/types/notification.types'

const NotificationDropdown: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch initial notifications
  const fetchNotifications = React.useCallback(async () => {
    if (!user) return
    try {
      const data = await notificationService.getMyNotifications(20, 0)
      // Backend returns { notifications: [], unreadCount: 0 } structure if created in earlier step
      // or check controller response format.
      // Controller returns { data: { notifications, unreadCount } } -> handled by service wrapper?
      // Service wrapper `return response.data.data`. So `data` is `{ notifications, unreadCount }`.
      if (data) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, fetchNotifications])

  // WebSocket connection
  useEffect(() => {
    if (!user) return

    const socketUrl =
      import.meta.env.REACT_APP_API_URL || 'https://api.algoforge.site'
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      // Authenticate
      socket.emit('authenticate', { userId: user.id })
    })

    socket.on('notification_new', (newNotification: Notification) => {
      // Add to list and increment unread
      setNotifications(prev => [newNotification, ...prev])
      setUnreadCount(prev => prev + 1)

      // Optional: Play sound or show toast
    })

    return () => {
      socket.disconnect()
    }
  }, [user])

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await notificationService.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read', error)
      // Optional: show toast error
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id)
    }
    setIsOpen(false)

    // Navigate based on metadata
    if (notification.metadata?.link) {
      navigate(notification.metadata.link)
    } else if (
      notification.type === ENotificationType.NEW_EXAM &&
      notification.metadata?.examId
    ) {
      navigate(`/exam/${notification.metadata.examId}`)
    }
    // Add other types handling
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="nav-icon relative text-foreground transition-colors hover:text-muted-foreground focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-xl border border-border bg-card shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-medium text-green-500 hover:text-green-600 focus:outline-none"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="scrollbar-thin scrollbar-thumb-muted max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
                  <Bell className="mb-2 h-8 w-8 opacity-20" />
                  <span className="text-sm">No notifications</span>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {notifications.map(notification => (
                    <li
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`group relative cursor-pointer px-4 py-3 transition-colors hover:bg-accent ${
                        !notification.isRead ? 'bg-accent/50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${!notification.isRead ? 'bg-green-500' : 'bg-transparent'}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm ${!notification.isRead ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
                          >
                            {notification.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                        </div>
                        {/* Action Buttons (visible on hover) */}
                        <div className="opacity-0 transition-opacity group-hover:opacity-100">
                          {!notification.isRead && (
                            <button
                              onClick={e =>
                                handleMarkAsRead(notification.id, e)
                              }
                              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-green-500"
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-border bg-card/50 px-4 py-2 text-center">
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationDropdown
