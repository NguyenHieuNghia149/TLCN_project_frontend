// @vitest-environment jsdom

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
    window.localStorage.clear()
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

  it('clears session when boot refresh returns AUTHENTICATION_ERROR', async () => {
    window.localStorage.setItem('auth_is_authenticated', 'true')
    const authError = new Error('Not authenticated')
    ;(authError as unknown as { code: string }).code = 'AUTHENTICATION_ERROR'
    vi.mocked(authService.refreshToken).mockRejectedValue(authError)

    const defaultState = authReducer(undefined, { type: '@@INIT' })
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          ...defaultState,
          session: {
            user: null,
            isAuthenticated: true,
            isLoading: true,
          },
        },
      },
    })

    const action = await store.dispatch(initializeSession())

    expect(initializeSession.rejected.match(action)).toBe(true)
    expect(store.getState().auth.session).toEqual({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
    expect(window.localStorage.getItem('auth_is_authenticated')).toBeNull()
  })

  it('clears session when boot refresh returns REFRESH_TOKEN_NOT_FOUND', async () => {
    window.localStorage.setItem('auth_is_authenticated', 'true')
    const authError = new Error('Refresh token expired or revoked')
    ;(authError as unknown as { code: string }).code = 'REFRESH_TOKEN_NOT_FOUND'
    vi.mocked(authService.refreshToken).mockRejectedValue(authError)

    const defaultState = authReducer(undefined, { type: '@@INIT' })
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          ...defaultState,
          session: {
            user: null,
            isAuthenticated: true,
            isLoading: true,
          },
        },
      },
    })

    const action = await store.dispatch(initializeSession())

    expect(initializeSession.rejected.match(action)).toBe(true)
    expect(store.getState().auth.session).toEqual({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
    expect(window.localStorage.getItem('auth_is_authenticated')).toBeNull()
  })

  it('preserves session when boot refresh returns generic Not authenticated (transient error)', async () => {
    window.localStorage.setItem('auth_is_authenticated', 'true')
    vi.mocked(authService.refreshToken).mockRejectedValue(
      new Error('Not authenticated')
    )

    const defaultState = authReducer(undefined, { type: '@@INIT' })
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          ...defaultState,
          session: {
            user: null,
            isAuthenticated: true,
            isLoading: true,
          },
        },
      },
    })

    const action = await store.dispatch(initializeSession())

    expect(initializeSession.rejected.match(action)).toBe(true)
    expect(store.getState().auth.session).toEqual({
      user: null,
      isAuthenticated: true,
      isLoading: false,
    })
    expect(window.localStorage.getItem('auth_is_authenticated')).toBe('true')
    expect(authService.clearAllAuthData).not.toHaveBeenCalled()
  })
})
