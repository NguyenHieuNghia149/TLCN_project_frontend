import { apiClient } from '../../config/axios.config'

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalLessons: number
  totalChallenges: number
  totalSubmissions: number
  totalExams: number
  totalTopics: number
  userGrowth: Array<{ date: string; count: number }>
  submissionTrend: Array<{ date: string; count: number }>
  lessonStats: Array<{ name: string; count: number }>
  topicDistribution: Array<{ name: string; lessons: number; problems: number }>
  submissionStatus: {
    accepted: number
    rejected: number
    pending: number
  }
  recentUsers: Array<{
    id: string
    firstName: string | null
    lastName: string | null
    createdAt: string | Date
  }>
  recentLessons: Array<{
    id: string
    title: string | null
    createdAt: string | Date
  }>
  recentProblems: Array<{
    id: string
    title: string | null
    createdAt: string | Date
  }>
  recentExams: Array<{
    id: string
    title: string | null
    createdAt: string | Date
  }>
}

export interface DashboardStatsResponse {
  success: boolean
  data: DashboardStats
}

class DashboardAPI {
  async getStats(): Promise<DashboardStatsResponse> {
    const response = await apiClient.get<DashboardStatsResponse>(
      '/admin/dashboard/stats'
    )
    return response.data
  }
}

export default new DashboardAPI()
