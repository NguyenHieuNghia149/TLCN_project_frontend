import { apiClient } from '@/config/axios.config'
import {
  normalizeExamChallengeResponse,
  type RawExamChallengeResponse,
} from '@/utils/challengeResponse'
import type {
  AdminExamParticipant,
  AdminUserLookupItem,
  CreateExamPayload,
  Exam,
  ExamAccessState,
  ExamChallengeResponse,
  ExamInviteResolution,
  ExamParticipation,
  ExamSessionSyncResponse,
  PublicExamLanding,
} from '@/types/exam.types'
import type { ChallengeItem } from '@/types/challenge.types'

type AdminUsersApiResponse = {
  data?:
    | {
        data?: Array<{
          id: string
          firstName?: string
          lastName?: string
          email: string
          role?: string
        }>
        pagination?: { total?: number }
      }
    | Array<{
        id: string
        firstName?: string
        lastName?: string
        email: string
        role?: string
      }>
  pagination?: { total?: number }
  total?: number
}

type AdminUserLookupPayloadItem = {
  id: string
  firstName?: string
  lastName?: string
  email: string
  role?: string
}

function normalizeAdminExamChallenge(
  challenge: Record<string, unknown>
): ChallengeItem {
  return {
    id: String(challenge.challengeId ?? challenge.id ?? ''),
    title: String(challenge.title ?? 'Untitled challenge'),
    description: String(challenge.description ?? ''),
    difficulty: (challenge.difficulty as ChallengeItem['difficulty']) ?? 'easy',
    topic: String(challenge.topicName ?? ''),
    topicName: challenge.topicName ? String(challenge.topicName) : undefined,
    createdAt: String(challenge.createdAt ?? new Date(0).toISOString()),
    totalPoints: 0,
    isSolved: false,
    isFavorite: false,
    visibility: String(challenge.visibility ?? 'public'),
  }
}

function normalizeAdminExam(exam: Exam): Exam {
  return {
    ...exam,
    challenges: Array.isArray(exam.challenges)
      ? exam.challenges.map(item =>
          normalizeAdminExamChallenge(
            item as unknown as Record<string, unknown>
          )
        )
      : [],
  }
}

function normalizeAdminUsersResponse(
  payload: AdminUsersApiResponse
): AdminUserLookupItem[] {
  const maybeData = payload?.data
  let rawUsers: AdminUserLookupPayloadItem[] = []

  if (Array.isArray(maybeData)) {
    rawUsers = maybeData
  } else if (maybeData && Array.isArray(maybeData.data)) {
    rawUsers = maybeData.data
  }

  return rawUsers.map(user => ({
    id: user.id,
    email: user.email,
    fullName:
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    role: String(user.role || 'user'),
  }))
}

function unwrapResponseData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = (payload as { data?: unknown }).data
    if (nested !== undefined && nested !== null) {
      return nested as T
    }
  }
  return payload as T
}

function unwrapArrayResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    const nested = (payload as { data?: unknown }).data
    if (Array.isArray(nested)) {
      return nested as T[]
    }
    if (nested && typeof nested === 'object' && 'data' in nested) {
      const deepNested = (nested as { data?: unknown }).data
      if (Array.isArray(deepNested)) {
        return deepNested as T[]
      }
    }
  }

  return []
}

export class ExamService {
  async getAdminExams(
    limit = 10,
    offset = 0,
    search?: string
  ): Promise<{ data: Exam[]; total: number }> {
    const response = await apiClient.get('/admin/exams', {
      params: { limit, offset, search },
    })
    const payload = response.data as
      | Exam[]
      | {
          data?:
            | Exam[]
            | {
                data?: Exam[]
                total?: number
              }
          total?: number
        }
    const topLevelData =
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? payload.data
        : undefined
    const nestedData =
      topLevelData &&
      typeof topLevelData === 'object' &&
      !Array.isArray(topLevelData)
        ? topLevelData.data
        : undefined
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(topLevelData)
        ? topLevelData
        : Array.isArray(nestedData)
          ? nestedData
          : []
    const total =
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? typeof payload.total === 'number'
          ? payload.total
          : topLevelData &&
              typeof topLevelData === 'object' &&
              !Array.isArray(topLevelData) &&
              typeof topLevelData.total === 'number'
            ? topLevelData.total
            : items.length
        : items.length

    return {
      data: items,
      total,
    }
  }

  async getAdminExamById(id: string): Promise<Exam> {
    const response = await apiClient.get(`/admin/exams/${id}`)
    return normalizeAdminExam(unwrapResponseData<Exam>(response.data))
  }

  async createAdminExam(data: CreateExamPayload): Promise<Exam> {
    const response = await apiClient.post('/admin/exams', data)
    return normalizeAdminExam(unwrapResponseData<Exam>(response.data))
  }

  async updateAdminExam(
    id: string,
    data: Partial<CreateExamPayload>
  ): Promise<Exam> {
    const response = await apiClient.put(`/admin/exams/${id}`, data)
    return normalizeAdminExam(unwrapResponseData<Exam>(response.data))
  }

  async publishAdminExam(id: string): Promise<Exam> {
    const response = await apiClient.post(`/admin/exams/${id}/publish`)
    return normalizeAdminExam(unwrapResponseData<Exam>(response.data))
  }

  async getAdminExamParticipants(
    examId: string
  ): Promise<AdminExamParticipant[]> {
    const response = await apiClient.get(`/admin/exams/${examId}/participants`)
    return unwrapArrayResponse<AdminExamParticipant>(response.data)
  }

  async addAdminExamParticipants(
    examId: string,
    payload: {
      participants: Array<{
        email?: string
        fullName?: string
        userId?: string
      }>
    }
  ): Promise<AdminExamParticipant[]> {
    const response = await apiClient.post(
      `/admin/exams/${examId}/participants`,
      payload
    )
    return unwrapArrayResponse<AdminExamParticipant>(response.data)
  }

  async importAdminExamParticipants(
    examId: string,
    payload: {
      participants: Array<{
        email?: string
        fullName?: string
        userId?: string
      }>
    }
  ): Promise<AdminExamParticipant[]> {
    const response = await apiClient.post(
      `/admin/exams/${examId}/participants/import`,
      payload
    )
    return unwrapArrayResponse<AdminExamParticipant>(response.data)
  }

  async approveAdminExamParticipant(
    examId: string,
    participantId: string
  ): Promise<AdminExamParticipant> {
    const response = await apiClient.post(
      `/admin/exams/${examId}/participants/${participantId}/approve`
    )
    return unwrapResponseData<AdminExamParticipant>(response.data)
  }

  async rejectAdminExamParticipant(
    examId: string,
    participantId: string
  ): Promise<AdminExamParticipant> {
    const response = await apiClient.post(
      `/admin/exams/${examId}/participants/${participantId}/reject`
    )
    return unwrapResponseData<AdminExamParticipant>(response.data)
  }

  async revokeAdminExamParticipant(
    examId: string,
    participantId: string
  ): Promise<AdminExamParticipant> {
    const response = await apiClient.post(
      `/admin/exams/${examId}/participants/${participantId}/revoke`
    )
    return unwrapResponseData<AdminExamParticipant>(response.data)
  }

  async resendAdminExamParticipantInvite(
    examId: string,
    participantId: string
  ): Promise<{
    inviteId: string
    participantId: string
    sentAt: string
    expiresAt: string
  }> {
    const response = await apiClient.post(
      `/admin/exams/${examId}/participants/${participantId}/resend-invite`
    )
    return unwrapResponseData<{
      inviteId: string
      participantId: string
      sentAt: string
      expiresAt: string
    }>(response.data)
  }

  async bindAdminExamParticipantAccount(
    examId: string,
    participantId: string,
    userId: string
  ): Promise<AdminExamParticipant> {
    const response = await apiClient.post(
      `/admin/exams/${examId}/participants/${participantId}/bind-account`,
      { userId }
    )
    return unwrapResponseData<AdminExamParticipant>(response.data)
  }

  async mergeAdminExamParticipants(
    examId: string,
    payload: { sourceParticipantId: string; targetParticipantId: string }
  ): Promise<AdminExamParticipant> {
    const response = await apiClient.post(
      `/admin/exams/${examId}/participants/merge`,
      payload
    )
    return unwrapResponseData<AdminExamParticipant>(response.data)
  }

  async searchAdminUsers(
    search: string,
    limit = 20
  ): Promise<AdminUserLookupItem[]> {
    const response = await apiClient.get<AdminUsersApiResponse>(
      '/admin/users',
      {
        params: {
          search: search || undefined,
          limit,
        },
      }
    )
    return normalizeAdminUsersResponse(response.data)
  }

  async getExams(
    limit = 10,
    offset = 0,
    search?: string,
    filterType?: 'all' | 'my' | 'participated',
    isVisible?: boolean
  ): Promise<{ data: Exam[]; total: number }> {
    const params = { limit, offset, search, filterType, isVisible }
    const response = await apiClient.get('/exams', { params })
    const payload = response.data?.data ?? response.data
    const items = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : []
    const total =
      typeof payload?.total === 'number'
        ? payload.total
        : Number(payload?.total ?? items.length)

    return {
      data: items,
      total,
    }
  }

  async getExamById(id: string): Promise<Exam> {
    const response = await apiClient.get(`/exams/${id}`)
    return response.data?.data ?? response.data
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
    const response = await apiClient.post(`/exams/${examId}/join`, {
      password,
      examPassword: password,
    })
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
  ): Promise<ExamChallengeResponse> {
    const response = await apiClient.get<RawExamChallengeResponse>(
      `/exams/${examId}/challenge/${challengeId}`
    )
    return normalizeExamChallengeResponse(response.data)
  }

  // Sync session progress
  async syncSession(
    participationId: string,
    answers: Record<string, unknown>
  ): Promise<ExamSessionSyncResponse> {
    const response = await apiClient.put('/exams/session/sync', {
      participationId,
      answers,
    })
    return response.data
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

  async getPublicExam(slug: string): Promise<PublicExamLanding> {
    const response = await apiClient.get(`/public/exams/${slug}`)
    return unwrapResponseData<PublicExamLanding>(response.data)
  }

  async getExamAccessState(slug: string): Promise<ExamAccessState> {
    const response = await apiClient.get(`/exams/${slug}/me/access-state`)
    return unwrapResponseData<ExamAccessState>(response.data)
  }

  async registerForExam(
    slug: string,
    payload: { email: string; fullName: string; examPassword?: string }
  ): Promise<ExamAccessState> {
    const response = await apiClient.post(
      `/public/exams/${slug}/register`,
      payload
    )
    return unwrapResponseData<ExamAccessState>(response.data)
  }

  async resolveInvite(
    slug: string,
    inviteToken: string
  ): Promise<ExamAccessState | ExamInviteResolution> {
    const response = await apiClient.post(
      `/public/exams/${slug}/invites/resolve`,
      {
        inviteToken,
      }
    )
    return unwrapResponseData<ExamAccessState | ExamInviteResolution>(
      response.data
    )
  }

  async sendExamOtp(
    slug: string,
    email: string
  ): Promise<{ sent: boolean; cooldownSeconds: number }> {
    const response = await apiClient.post(`/public/exams/${slug}/otp/send`, {
      email,
    })
    return unwrapResponseData<{ sent: boolean; cooldownSeconds: number }>(
      response.data
    )
  }

  async verifyExamOtp(
    slug: string,
    payload: { email: string; otp: string }
  ): Promise<ExamAccessState & { tokens?: { accessToken?: string } }> {
    const response = await apiClient.post(
      `/public/exams/${slug}/otp/verify`,
      payload
    )
    return unwrapResponseData<
      ExamAccessState & { tokens?: { accessToken?: string } }
    >(response.data)
  }

  async startEntrySession(entrySessionId: string): Promise<{
    participationId: string
    expiresAt: string
    firstChallengeId: string | null
  }> {
    const response = await apiClient.post(
      `/exams/entry-sessions/${entrySessionId}/start`
    )
    return unwrapResponseData<{
      participationId: string
      expiresAt: string
      firstChallengeId: string | null
    }>(response.data)
  }

  async submitExamBySlug(slug: string): Promise<{
    participationId: string
    submittedAt: string
    scoreStatus: string
  }> {
    const response = await apiClient.post(`/exams/${slug}/submit`, {})
    return unwrapResponseData<{
      participationId: string
      submittedAt: string
      scoreStatus: string
    }>(response.data)
  }
}

export const examService = new ExamService()
