import { apiClient } from '@/config/axios.config'
import { CreateExamPayload, Exam } from '@/types/exam.types'

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
}

export const examService = new ExamService()
