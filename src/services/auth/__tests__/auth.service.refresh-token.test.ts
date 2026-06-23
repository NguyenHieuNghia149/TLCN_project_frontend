// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'

const postMock = vi.fn()
const createMock = vi.fn(() => ({
  post: postMock,
}))

vi.mock('axios', () => ({
  default: {
    create: createMock,
  },
}))

vi.mock('@/config/axios.config', () => ({
  apiClient: {},
}))

describe('AuthService.refreshToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.cookie = ''
  })

  it('keeps generic 401 refresh failures as transient "Not authenticated" errors', async () => {
    postMock.mockResolvedValue({
      status: 401,
      data: {
        message: 'Not authenticated',
      },
    })

    const { authService } = await import('../auth.service')

    await expect(authService.refreshToken()).rejects.toMatchObject({
      message: 'Not authenticated',
    })
  })

  it('preserves explicit refresh-token expiry codes for hard logout handling', async () => {
    postMock.mockResolvedValue({
      status: 401,
      data: {
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token expired',
      },
    })

    const { authService } = await import('../auth.service')

    await authService.refreshToken().catch(error => {
      expect(error).toMatchObject({
        message: 'Refresh token expired or revoked',
        code: 'REFRESH_TOKEN_EXPIRED',
      })
    })
  })

  it('succeeds without returning or storing a client-managed token', async () => {
    postMock.mockResolvedValue({
      status: 200,
      data: {
        data: {
          user: {
            id: 'user-1',
            email: 'session@example.com',
            firstname: 'Session',
            lastname: 'User',
            role: 'user',
            createdAt: '2025-01-01T00:00:00.000Z',
            lastLoginAt: '2025-01-01T00:00:00.000Z',
          },
        },
      },
    })

    const { authService } = await import('../auth.service')

    await expect(authService.refreshToken()).resolves.toEqual({
      id: 'user-1',
      email: 'session@example.com',
      firstname: 'Session',
      lastname: 'User',
      role: 'user',
      createdAt: '2025-01-01T00:00:00.000Z',
      lastLoginAt: '2025-01-01T00:00:00.000Z',
    })
  })

  it('sends X-CSRF-Token on the refresh bootstrap request when a readable cookie is present', async () => {
    document.cookie = 'csrfToken=bootstrap-csrf-token'
    postMock.mockResolvedValue({
      status: 200,
      data: {
        data: {
          user: {
            id: 'user-1',
            email: 'session@example.com',
          },
        },
      },
    })

    const { authService } = await import('../auth.service')

    await authService.refreshToken()

    expect(postMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/refresh-token$/),
      {},
      expect.objectContaining({
        withCredentials: true,
        headers: {
          'X-CSRF-Token': 'bootstrap-csrf-token',
        },
      })
    )
  })
})
