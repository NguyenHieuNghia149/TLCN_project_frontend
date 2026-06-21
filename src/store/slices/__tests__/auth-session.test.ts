import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '../../../services/auth/auth.service'
import authReducer, { initializeSession } from '../authSlice'
import type { User } from '../../../types/auth.types'

vi.mock('../../../services/auth/auth.service', () => ({
  ApiError: class ApiError extends Error {},
  authService: {
    refreshToken: vi.fn(),
    getCurrentUser: vi.fn(),
    clearAllAuthData: vi.fn(),
  },
}))

describe('initializeSession', () => {
  const refreshedUser: User = {
    id: 'user-1',
    email: 'session@example.com',
    firstname: 'Session',
    lastname: 'User',
    role: 'user',
    createdAt: '2025-01-01T00:00:00.000Z',
    lastLoginAt: '2025-01-01T00:00:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.refreshToken).mockResolvedValue({
      accessToken: 'access-token',
      user: refreshedUser,
    } as never)
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      ...refreshedUser,
      email: 'profile-request-was-used@example.com',
    })
  })

  it('restores the user carried by refresh without fetching the detailed profile', async () => {
    const store = configureStore({ reducer: { auth: authReducer } })

    const action = await store.dispatch(initializeSession())

    expect(initializeSession.fulfilled.match(action)).toBe(true)
    expect(authService.getCurrentUser).not.toHaveBeenCalled()
    expect(store.getState().auth.session.user).toEqual(refreshedUser)
  })
})
