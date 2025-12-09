import { apiClient } from '@/config/axios.config'
import type { Exam } from '@/types/exam.types'

class ExamService {
  async getExamById(examId: string): Promise<Exam> {
    const res = await apiClient.get(`/exams/${examId}`)
    const json = res.data as {
      success?: boolean
      data?: Exam
      message?: string
    }
    if (!json?.success || !json?.data) {
      throw new Error(json?.message || 'Failed to fetch exam')
    }
    return json.data
  }

  async joinExam(examId: string, password: string) {
    const res = await apiClient.post(`/exams/${examId}/join`, { password })
    return res.data
  }

  async getExams(limit = 50, offset = 0, search?: string, filterType?: string) {
    const params: Record<string, unknown> = { limit, offset }
    if (search) params.search = search
    if (filterType) params.filterType = filterType

    const res = await apiClient.get('/exams', { params })
    return res.data
  }

  async submitExam(examId: string, participationId: string) {
    const res = await apiClient.post(`/exams/${examId}/submit`, {
      participationId,
    })
    return res.data
  }

  async getLeaderboard(examId: string, limit = 50, offset = 0) {
    const res = await apiClient.get(`/exams/${examId}/leaderboard`, {
      params: { limit, offset },
    })
    return res.data
  }

  /**
   * Get detailed information about a specific challenge in an exam
   * Call this when switching between challenges to avoid loading all at once
   */
  async getExamChallenge(examId: string, challengeId: string) {
    const res = await apiClient.get(`/exams/${examId}/challenge/${challengeId}`)
    return res.data
  }

  /**
   * Try to retrieve participation/session details for a given participationId.
   * Backend may return fields like: id, examId, userId, startedAt, startAt, startTimestamp, currentChallengeId
   */
  async getParticipation(examId: string, participationId: string) {
    const res = await apiClient.get(
      `/exams/${examId}/participation/${participationId}`
    )
    return res.data
  }

  async getMyParticipation(examId: string) {
    const res = await apiClient.get(`/exams/${examId}/participation/me`)
    return res.data
  }

  /**
   * Sync current session/participation answers to server.
   * Body: { sessionId, answers, clientTimestamp }
   */
  async syncSession(sessionId: string, answers: Record<string, unknown>) {
    const res = await apiClient.put(`/exams/session/sync`, {
      sessionId,
      answers: answers || {},
      clientTimestamp: new Date().toISOString(),
    })
    return res.data
  }

  /**
   * Get detailed submission for a participation (with solutions and scores)
   */
  async getSubmissionDetails(examId: string, participationId: string) {
    const res = await apiClient.get(
      `/exams/${examId}/participation/${participationId}/submission`
    )
    return res.data?.data || res.data
  }
}
export const examService = new ExamService()
