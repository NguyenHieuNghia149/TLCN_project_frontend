import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock, postMock, putMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
  deleteMock: vi.fn(),
}))

vi.mock('@/config/axios.config', () => ({
  apiClient: {
    get: getMock,
    post: postMock,
    put: putMock,
    delete: deleteMock,
  },
}))

import { examService } from '@/services/api/exam.service'

describe('examService', () => {
  beforeEach(() => {
    getMock.mockReset()
    postMock.mockReset()
    putMock.mockReset()
    deleteMock.mockReset()
  })

  it('unwraps the nested exam list payload returned by the API', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          data: [
            {
              id: 'exam-1',
              title: 'Midterm',
              duration: 90,
              startDate: '2026-01-01T00:00:00.000Z',
              endDate: '2026-01-01T01:30:00.000Z',
              isVisible: true,
              maxAttempts: 1,
              challenges: [],
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          total: 1,
        },
        error: null,
      },
    })

    await expect(
      examService.getExams(6, 0, undefined, 'all', true)
    ).resolves.toEqual({
      data: [
        {
          id: 'exam-1',
          title: 'Midterm',
          duration: 90,
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-01-01T01:30:00.000Z',
          isVisible: true,
          maxAttempts: 1,
          challenges: [],
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      total: 1,
    })

    expect(getMock).toHaveBeenCalledWith('/exams', {
      params: {
        limit: 6,
        offset: 0,
        search: undefined,
        filterType: 'all',
        isVisible: true,
      },
    })
  })
})
