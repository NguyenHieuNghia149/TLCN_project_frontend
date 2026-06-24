import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/axios.config', () => ({
  apiClient: {
    post: vi.fn(),
    put: vi.fn(),
  },
}))

import { apiClient } from '@/config/axios.config'
import { ExamService } from '@/services/api/exam.service'

describe('ExamService', () => {
  const service = new ExamService()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses an extended timeout for translating proctoring LLM summaries', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: {
        data: {
          translatedText: 'Ban dich tieng Viet.',
          targetLanguage: 'vi',
        },
      },
    } as never)

    await expect(
      service.translateAdminProctoringLlmSummary('exam-1', 'participation-1', {
        targetLanguage: 'vi',
      })
    ).resolves.toEqual({
      translatedText: 'Ban dich tieng Viet.',
      targetLanguage: 'vi',
    })

    expect(apiClient.post).toHaveBeenCalledWith(
      '/admin/exams/exam-1/participations/participation-1/proctoring/llm-summary/translate',
      { targetLanguage: 'vi' },
      { timeout: 45000 }
    )
  })

  it('updates admin proctoring settings with PUT', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({
      data: {
        data: {
          examId: 'exam-1',
          enabled: true,
          aiShadowMode: false,
          aiAdvisoryVisible: true,
        },
      },
    } as never)

    await expect(
      service.updateAdminProctoringSettings('exam-1', {
        enabled: true,
        aiShadowMode: false,
        aiAdvisoryVisible: true,
      })
    ).resolves.toMatchObject({
      examId: 'exam-1',
      enabled: true,
      aiShadowMode: false,
      aiAdvisoryVisible: true,
    })

    expect(apiClient.put).toHaveBeenCalledWith(
      '/admin/exams/exam-1/proctoring/settings',
      {
        enabled: true,
        aiShadowMode: false,
        aiAdvisoryVisible: true,
      }
    )
  })
})
