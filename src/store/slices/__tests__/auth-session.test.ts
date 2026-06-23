// @vitest-environment jsdom

import { configureStore } from '@reduxjs/toolkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '../../../services/auth/auth.service'
import authReducer, { initializeSession, logoutUser } from '../authSlice'
import type { User } from '../../../types/auth.types'

vi.mock('../../../services/auth/auth.service', () => ({
  ApiError: class ApiError extends Error {},
  authService: {
    refreshToken: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    clearAllAuthData: vi.fn(),
  },
}))

describe('auth session boot', () => {
  const currentUser: User = {
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
    window.sessionStorage.clear()
    vi.clearAllMocks()
    vi.mocked(authService.getCurrentUser).mockResolvedValue(currentUser)
    vi.mocked(authService.refreshToken).mockResolvedValue(currentUser)
    vi.mocked(authService.logout).mockResolvedValue(undefined)
  })

  it('boots from /auth/me before considering refresh recovery', async () => {
    const store = configureStore({ reducer: { auth: authReducer } })

    const action = await store.dispatch(initializeSession())

    expect(initializeSession.fulfilled.match(action)).toBe(true)
    expect(authService.getCurrentUser).toHaveBeenCalledTimes(1)
    expect(authService.refreshToken).not.toHaveBeenCalled()
    expect(store.getState().auth.session).toEqual({
      user: currentUser,
      isAuthenticated: true,
      isLoading: false,
    })
  })

  it('uses refresh only after /auth/me returns 401-style authentication failure', async () => {
    const authError = new Error('Not authenticated')
    ;(authError as { code?: string }).code = 'AUTHENTICATION_ERROR'
    vi.mocked(authService.getCurrentUser).mockRejectedValue(authError)

    const store = configureStore({ reducer: { auth: authReducer } })

    const action = await store.dispatch(initializeSession())

    expect(initializeSession.fulfilled.match(action)).toBe(true)
    expect(authService.getCurrentUser).toHaveBeenCalledTimes(1)
    expect(authService.refreshToken).toHaveBeenCalledTimes(1)
    expect(store.getState().auth.session.user).toEqual(currentUser)
  })

  it('clears UI session state when refresh recovery reports the session is expired', async () => {
    const meError = new Error('Not authenticated')
    ;(meError as { code?: string }).code = 'AUTHENTICATION_ERROR'
    vi.mocked(authService.getCurrentUser).mockRejectedValue(meError)

    const refreshError = new Error('Refresh token expired or revoked')
    ;(refreshError as { code?: string }).code = 'REFRESH_TOKEN_EXPIRED'
    vi.mocked(authService.refreshToken).mockRejectedValue(refreshError)

    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          session: {
            user: currentUser,
            isAuthenticated: true,
            isLoading: true,
          },
          login: {
            isLoading: false,
            error: null,
            fieldErrors: {},
            lastAttempt: null,
          },
          register: {
            isLoading: false,
            isOtpSent: false,
            otpCooldown: 0,
            error: null,
            fieldErrors: {},
            registrationEmail: null,
            step: 'register' as const,
            pendingRegistration: null,
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
  })

  it('does not hydrate or persist auth state through browser storage', async () => {
    const localSetItemSpy = vi.spyOn(window.localStorage.__proto__, 'setItem')
    const sessionSetItemSpy = vi.spyOn(
      window.sessionStorage.__proto__,
      'setItem'
    )
    const localRemoveItemSpy = vi.spyOn(
      window.localStorage.__proto__,
      'removeItem'
    )
    const sessionRemoveItemSpy = vi.spyOn(
      window.sessionStorage.__proto__,
      'removeItem'
    )

    const store = configureStore({ reducer: { auth: authReducer } })

    await store.dispatch(initializeSession())
    await store.dispatch(logoutUser())

    expect(localSetItemSpy).not.toHaveBeenCalled()
    expect(sessionSetItemSpy).not.toHaveBeenCalled()
    expect(localRemoveItemSpy).not.toHaveBeenCalled()
    expect(sessionRemoveItemSpy).not.toHaveBeenCalled()
  })

  it('logout clears redux session state without invoking browser auth-data cleanup', async () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: {
        auth: {
          session: {
            user: currentUser,
            isAuthenticated: true,
            isLoading: false,
          },
          login: {
            isLoading: false,
            error: null,
            fieldErrors: {},
            lastAttempt: null,
          },
          register: {
            isLoading: false,
            isOtpSent: false,
            otpCooldown: 0,
            error: null,
            fieldErrors: {},
            registrationEmail: null,
            step: 'register' as const,
            pendingRegistration: null,
          },
        },
      },
    })

    const action = await store.dispatch(logoutUser())

    expect(logoutUser.fulfilled.match(action)).toBe(true)
    expect(authService.clearAllAuthData).not.toHaveBeenCalled()
    expect(store.getState().auth.session).toEqual({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  })
})
