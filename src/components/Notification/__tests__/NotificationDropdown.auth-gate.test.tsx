// @vitest-environment jsdom

import React from 'react'
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const authState = vi.hoisted(() => ({
  user: null as { id: string } | null,
  isAuthenticated: false,
}))

const mocks = vi.hoisted(() => ({
  getMyNotifications: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  navigate: vi.fn(),
  io: vi.fn(),
}))

vi.mock('@/hooks/api/useAuth', () => ({
  useAuth: () => authState,
}))

vi.mock('@/services/api/notifications.service', () => ({
  notificationService: {
    getMyNotifications: mocks.getMyNotifications,
    markAsRead: mocks.markAsRead,
    markAllAsRead: mocks.markAllAsRead,
  },
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}))

vi.mock('socket.io-client', () => ({
  io: mocks.io,
}))

describe('NotificationDropdown auth gate', () => {
  beforeEach(() => {
    authState.user = null
    authState.isAuthenticated = false
    vi.clearAllMocks()
    mocks.getMyNotifications.mockResolvedValue({
      notifications: [],
      unreadCount: 0,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('does not fetch notifications or open a socket when the user is unauthenticated', async () => {
    const { default: NotificationDropdown } =
      await import('../NotificationDropdown')

    render(<NotificationDropdown />)

    await Promise.resolve()

    expect(mocks.getMyNotifications).not.toHaveBeenCalled()
    expect(mocks.io).not.toHaveBeenCalled()
  })

  it('fetches notifications and cleans up socket listeners for authenticated users', async () => {
    authState.user = { id: 'user-1' }
    authState.isAuthenticated = true

    const socket = {
      on: vi.fn(),
      off: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn(),
    }
    mocks.io.mockReturnValue(socket)

    const { default: NotificationDropdown } =
      await import('../NotificationDropdown')
    const { unmount } = render(<NotificationDropdown />)

    await waitFor(() => {
      expect(mocks.getMyNotifications).toHaveBeenCalledWith(20, 0)
    })

    expect(mocks.io).toHaveBeenCalledTimes(1)
    expect(socket.connect).toHaveBeenCalledTimes(1)

    unmount()

    expect(socket.off).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(socket.off).toHaveBeenCalledWith(
      'notification_new',
      expect.any(Function)
    )
    expect(socket.disconnect).toHaveBeenCalledTimes(1)
  })
})
