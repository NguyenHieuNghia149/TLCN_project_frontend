// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'

const getMock = vi.fn()
const postMock = vi.fn()
const setCsrfTokenValueMock = vi.fn()

vi.mock('@/config/axios.config', () => ({
  apiClient: {
    get: getMock,
    post: postMock,
  },
  setCsrfTokenValue: setCsrfTokenValueMock,
}))

describe('AuthService cookie-only auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses /auth/me as the primary boot API', async () => {
    getMock.mockResolvedValue({
      headers: {},
      data: {
        data: {
          id: 'user-1',
          email: 'boot@example.com',
          firstname: 'Boot',
          lastname: 'User',
          role: 'user',
          createdAt: '2025-01-01T00:00:00.000Z',
          lastLoginAt: '2025-01-01T00:00:00.000Z',
        },
      },
    })

    const { authService } = await import('../auth.service')

    await expect(authService.getCurrentUser()).resolves.toEqual({
      id: 'user-1',
      email: 'boot@example.com',
      firstname: 'Boot',
      lastname: 'User',
      role: 'user',
      createdAt: '2025-01-01T00:00:00.000Z',
      lastLoginAt: '2025-01-01T00:00:00.000Z',
    })
    expect(getMock).toHaveBeenCalledWith('/auth/me')
  })

  it('captures csrfToken from /auth/me so mutating requests can reuse it after reload', async () => {
    getMock.mockResolvedValue({
      headers: {
        'x-csrf-token': 'boot-csrf-token',
      },
      data: {
        data: {
          id: 'user-1',
          email: 'boot@example.com',
          firstname: 'Boot',
          lastname: 'User',
          role: 'user',
          createdAt: '2025-01-01T00:00:00.000Z',
          lastLoginAt: '2025-01-01T00:00:00.000Z',
        },
      },
    })

    const { authService } = await import('../auth.service')

    await authService.getCurrentUser()

    expect(setCsrfTokenValueMock).toHaveBeenCalledWith('boot-csrf-token')
  })

  it('keeps accepting the legacy /auth/me wrapped profile payload', async () => {
    getMock.mockResolvedValue({
      headers: {},
      data: {
        data: {
          id: 'user-1',
          email: 'legacy@example.com',
          firstname: 'Legacy',
          lastname: 'User',
          role: 'user',
          createdAt: '2025-01-01T00:00:00.000Z',
          lastLoginAt: '2025-01-01T00:00:00.000Z',
        },
      },
    })

    const { authService } = await import('../auth.service')

    await expect(authService.getCurrentUser()).resolves.toEqual({
      id: 'user-1',
      email: 'legacy@example.com',
      firstname: 'Legacy',
      lastname: 'User',
      role: 'user',
      createdAt: '2025-01-01T00:00:00.000Z',
      lastLoginAt: '2025-01-01T00:00:00.000Z',
    })
  })

  it('consumes login user payload without reading token fields', async () => {
    postMock.mockResolvedValue({
      data: {
        data: {
          user: {
            id: 'user-1',
            email: 'login@example.com',
            firstname: 'Login',
            lastname: 'User',
            role: 'user',
            createdAt: '2025-01-01T00:00:00.000Z',
            lastLoginAt: '2025-01-01T00:00:00.000Z',
          },
          tokens: {
            accessToken: undefined,
          },
        },
      },
    })

    const { authService } = await import('../auth.service')

    await expect(
      authService.login({
        email: 'login@example.com',
        password: 'secret',
      })
    ).resolves.toEqual({
      user: {
        id: 'user-1',
        email: 'login@example.com',
        firstname: 'Login',
        lastname: 'User',
        role: 'user',
        createdAt: '2025-01-01T00:00:00.000Z',
        lastLoginAt: '2025-01-01T00:00:00.000Z',
      },
    })
  })
})
