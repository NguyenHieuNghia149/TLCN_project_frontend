// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'

const postMock = vi.fn()
const setAccessTokenMock = vi.fn()
const clearAccessTokenMock = vi.fn()
const setTokenRefreshCallbackMock = vi.fn()

vi.mock('@/config/axios.config', () => ({
  apiClient: {
    post: postMock,
  },
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn(),
    })),
  },
}))

vi.mock('../token.service', () => ({
  tokenManager: {
    setAccessToken: setAccessTokenMock,
    clearAccessToken: clearAccessTokenMock,
    setTokenRefreshCallback: setTokenRefreshCallbackMock,
  },
}))

describe('AuthService API error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prefers nested server error messages over code-like top-level messages', async () => {
    postMock.mockRejectedValue({
      response: {
        status: 404,
        statusText: 'Not Found',
        data: {
          message: 'USER_NOT_FOUND',
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User with this email does not exist',
          },
        },
      },
    })

    const { authService, ApiError } = await import('../auth.service')

    await expect(
      authService.sendResetOtp('missing@example.com')
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiError',
        code: 'USER_NOT_FOUND',
        message: 'User with this email does not exist',
      })
    )

    await authService.sendResetOtp('missing@example.com').catch(error => {
      expect(error).toBeInstanceOf(ApiError)
    })
  })
})
