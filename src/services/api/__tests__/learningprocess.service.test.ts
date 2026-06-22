import { describe, expect, it, vi, beforeEach } from 'vitest'
import { LearningProcessService } from '../learningprocess.service'
import { apiClient } from '@/config/axios.config'

vi.mock('@/config/axios.config', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

describe('LearningProcessService', () => {
  const service = new LearningProcessService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads recent topic from raw response body', async () => {
    const recentTopic = {
      topicId: 'topic-1',
      topicName: 'Algorithms',
      totalProblems: 10,
      solvedProblems: 2,
      completionPercentage: 20,
      lastSubmittedAt: null,
    }
    vi.mocked(apiClient.get).mockResolvedValue({ data: recentTopic } as never)

    await expect(service.getRecentTopic()).resolves.toEqual(recentTopic)
  })

  it('reads recent lesson from raw response body', async () => {
    const recentLesson = {
      lessonId: 'lesson-1',
      lessonTitle: 'Intro',
      topicId: 'topic-1',
      topicName: 'Algorithms',
      totalLessons: 5,
      completedLessons: 1,
      completionPercentage: 20,
      lastCompletedAt: null,
    }
    vi.mocked(apiClient.get).mockResolvedValue({ data: recentLesson } as never)

    await expect(service.getRecentLesson()).resolves.toEqual(recentLesson)
  })
})
