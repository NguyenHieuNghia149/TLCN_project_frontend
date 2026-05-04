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

  it('normalizes admin exam challenge links into challenge items', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        id: 'exam-1',
        title: 'Midterm',
        slug: 'midterm',
        duration: 90,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-01T01:30:00.000Z',
        isVisible: true,
        maxAttempts: 1,
        challenges: [
          {
            challengeId: 'challenge-1',
            title: 'Two Sum',
            description: 'Array problem',
            difficulty: 'easy',
            visibility: 'public',
            topicName: 'Arrays',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    })

    await expect(examService.getAdminExamById('exam-1')).resolves.toMatchObject(
      {
        id: 'exam-1',
        challenges: [
          {
            id: 'challenge-1',
            title: 'Two Sum',
            difficulty: 'easy',
            visibility: 'public',
            topicName: 'Arrays',
          },
        ],
      }
    )
  })

  it('unwraps nested admin exam list payload into an array', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          data: [
            {
              id: 'admin-exam-1',
              title: 'Admin Midterm',
              duration: 120,
              startDate: '2026-01-02T00:00:00.000Z',
              endDate: '2026-01-02T02:00:00.000Z',
              isVisible: true,
              maxAttempts: 1,
              challenges: [],
              createdAt: '2026-01-02T00:00:00.000Z',
            },
          ],
          total: 1,
        },
      },
    })

    await expect(examService.getAdminExams(500, 0)).resolves.toEqual({
      data: [
        {
          id: 'admin-exam-1',
          title: 'Admin Midterm',
          duration: 120,
          startDate: '2026-01-02T00:00:00.000Z',
          endDate: '2026-01-02T02:00:00.000Z',
          isVisible: true,
          maxAttempts: 1,
          challenges: [],
          createdAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      total: 1,
    })
  })

  it('parses admin user lookup payloads for participant binding', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        data: {
          data: [
            {
              id: 'user-1',
              firstName: 'Alice',
              lastName: 'Nguyen',
              email: 'alice@example.com',
              role: 'user',
            },
          ],
        },
      },
    })

    await expect(examService.searchAdminUsers('alice')).resolves.toEqual([
      {
        id: 'user-1',
        email: 'alice@example.com',
        fullName: 'Alice Nguyen',
        role: 'user',
      },
    ])

    expect(getMock).toHaveBeenCalledWith('/admin/users', {
      params: {
        search: 'alice',
        limit: 20,
      },
    })
  })

  it('sends examPassword to admin create endpoint without legacy password field', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        id: 'exam-2',
        title: 'Hybrid Exam',
        slug: 'hybrid-exam',
        duration: 90,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-01T01:30:00.000Z',
        isVisible: false,
        maxAttempts: 1,
        challenges: [],
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    })

    await examService.createAdminExam({
      title: 'Hybrid Exam',
      slug: 'hybrid-exam',
      examPassword: 'ExamPass123!',
      duration: 90,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-01T01:30:00.000Z',
      isVisible: false,
      maxAttempts: 1,
      accessMode: 'hybrid',
      selfRegistrationApprovalMode: 'manual',
      selfRegistrationPasswordRequired: true,
      allowExternalCandidates: true,
      registrationOpenAt: null,
      registrationCloseAt: null,
      challenges: [],
    })

    expect(postMock).toHaveBeenCalledWith(
      '/admin/exams',
      expect.objectContaining({
        examPassword: 'ExamPass123!',
      })
    )
    expect(postMock.mock.calls[0]?.[1]).not.toHaveProperty('password')
  })

  it('calls admin cancel endpoint and unwraps exam response', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        data: {
          id: 'exam-1',
          title: 'Midterm',
          status: 'cancelled',
          isVisible: false,
          duration: 90,
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-01-01T01:30:00.000Z',
          maxAttempts: 1,
          challenges: [],
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      },
    })

    await expect(examService.cancelAdminExam('exam-1')).resolves.toMatchObject({
      id: 'exam-1',
      status: 'cancelled',
      isVisible: false,
    })
    expect(postMock).toHaveBeenCalledWith('/admin/exams/exam-1/cancel')
  })

  it('calls admin archive endpoint and unwraps exam response', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        data: {
          id: 'exam-1',
          title: 'Midterm',
          status: 'archived',
          isVisible: false,
          duration: 90,
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-01-01T01:30:00.000Z',
          maxAttempts: 1,
          challenges: [],
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      },
    })

    await expect(examService.archiveAdminExam('exam-1')).resolves.toMatchObject(
      {
        id: 'exam-1',
        status: 'archived',
        isVisible: false,
      }
    )
    expect(postMock).toHaveBeenCalledWith('/admin/exams/exam-1/archive')
  })

  it('sends the exam password when starting an entry session', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        data: {
          participationId: 'participation-1',
          expiresAt: '2026-05-01T10:30:00.000Z',
          firstChallengeId: 'challenge-1',
        },
      },
    })

    await expect(
      examService.startEntrySession('entry-session-1', 'Exam#1234')
    ).resolves.toMatchObject({
      participationId: 'participation-1',
      firstChallengeId: 'challenge-1',
    })

    expect(postMock).toHaveBeenCalledWith(
      '/exams/entry-sessions/entry-session-1/start',
      {
        examPassword: 'Exam#1234',
      }
    )
  })
})
