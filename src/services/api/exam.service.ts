import { apiClient } from '@/config/axios.config'
import { CreateExamPayload, Exam, ExamParticipation } from '@/types/exam.types'

export class ExamService {
  async getExams(
    limit = 10,
    offset = 0,
    search?: string,
    filterType?: 'all' | 'my' | 'participated',
    isVisible?: boolean
  ): Promise<{ data: Exam[]; total: number }> {
    const params = { limit, offset, search, filterType, isVisible }
    const response = await apiClient.get('/exams', { params })
    return response.data
  }

  async getExamById(id: string): Promise<Exam> {
    const response = await apiClient.get(`/exams/${id}`)
    return response.data.data
  }

  async createExam(data: CreateExamPayload): Promise<Exam> {
    const response = await apiClient.post('/exams', data)
    return response.data.data
  }

  async updateExam(
    id: string,
    data: Partial<CreateExamPayload>
  ): Promise<Exam> {
    const response = await apiClient.put(`/exams/${id}`, data)
    return response.data.data
  }

  async deleteExam(id: string): Promise<void> {
    await apiClient.delete(`/exams/${id}`)
  }

  // Get user's participation for an exam
  async getMyParticipation(examId: string): Promise<ExamParticipation | null> {
    const response = await apiClient.get(`/exams/${examId}/participation/me`)
    return response.data.data
  }

  // Join an exam (create participation/session)
  async joinExam(
    examId: string,
    password?: string
  ): Promise<ExamParticipation> {
    const response = await apiClient.post(`/exams/${examId}/join`, { password })
    return response.data.data
  }

  // Get participation details by ID
  async getParticipation(
    examId: string,
    participationId: string
  ): Promise<ExamParticipation> {
    const response = await apiClient.get(
      `/exams/${examId}/participation/${participationId}`
    )
    return response.data.data
  }

  // Get specific challenge details within an exam
  async getExamChallenge(
    examId: string,
    challengeId: string
  ): Promise<{ data: unknown }> {
    const response = await apiClient.get(
      `/exams/${examId}/challenge/${challengeId}`
    )
    return response.data
  }

  // Sync session progress
  async syncSession(
    participationId: string,
    answers: Record<string, unknown>
  ): Promise<void> {
    await apiClient.put('/exams/session/sync', {
      sessionId: participationId,
      answers,
      clientTimestamp: new Date().toISOString(),
    })
  }

  // Get submission details for a participation
  async getSubmissionDetails(
    examId: string,
    participationId: string
  ): Promise<Record<string, unknown>> {
    const response = await apiClient.get(
      `/exams/${examId}/participation/${participationId}/submission`
    )
    return response.data.data
  }

  // Get exam leaderboard/submissions
  async getLeaderboard(
    examId: string,
    limit = 200,
    offset = 0
  ): Promise<{ data: unknown[] }> {
    const response = await apiClient.get(`/exams/${examId}/leaderboard`, {
      params: { limit, offset },
    })
    return response.data
  }
  // Submit exam (finish)
  async submitExam(
    examId: string,
    participationId: string
  ): Promise<ExamParticipation> {
    const response = await apiClient.post(`/exams/${examId}/submit`, {
      participationId,
    })
    return response.data.data
  }
}

export const examService = new ExamService()
