// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'

const postMock = vi.fn()
const createMock = vi.fn(() => ({
  post: postMock,
}))
const setAccessTokenMock = vi.fn()
const clearAccessTokenMock = vi.fn()
const setTokenRefreshCallbackMock = vi.fn()

vi.mock('axios', () => ({
  default: {
    create: createMock,
  },
}))

vi.mock('@/config/axios.config', () => ({
  apiClient: {},
}))

vi.mock('../token.service', () => ({
  tokenManager: {
    setAccessToken: setAccessTokenMock,
    clearAccessToken: clearAccessTokenMock,
    setTokenRefreshCallback: setTokenRefreshCallbackMock,
  },
}))

describe('AuthService.refreshToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    await authService.refreshToken().catch(error => {
      expect((error as { code?: string }).code).toBeUndefined()
    })
    expect(setAccessTokenMock).not.toHaveBeenCalled()
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
})
