import { beforeEach, describe, expect, it, vi } from 'vitest'

const getMock = vi.fn()
const putMock = vi.fn()

vi.mock('@/config/axios.config', () => ({
  apiClient: {
    get: getMock,
    put: putMock,
  },
}))

describe('profileAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps /auth/me response in the legacy profile response shape', async () => {
    const responseBody = {
      success: true,
      data: {
        id: 'user-1',
        email: 'profile@example.com',
        firstName: 'Profile',
        lastName: 'User',
        avatar: null,
        gender: null,
        dateOfBirth: null,
        role: 'user',
        status: 'active',
        lastLoginAt: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
        statistics: {
          totalSubmissions: 0,
          acceptedSubmissions: 0,
          wrongAnswerSubmissions: 0,
          timeLimitExceededSubmissions: 0,
          memoryLimitExceededSubmissions: 0,
          runtimeErrorSubmissions: 0,
          compilationErrorSubmissions: 0,
          totalProblemsSolved: 0,
          totalProblemsAttempted: 0,
          acceptanceRate: 0,
        },
      },
    }
    getMock.mockResolvedValue({ data: responseBody })

    const { profileAPI } = await import('../profile.service')

    await expect(profileAPI.getProfile()).resolves.toEqual(responseBody)
    expect(getMock).toHaveBeenCalledWith('/auth/me')
  })
})
