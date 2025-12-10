import { apiClient } from '@/config/axios.config'
import type {
  RunOrSubmitPayload,
  RunResponseWrapper,
  SubmitResponseData,
  SubmitResponseWrapper,
  SubmissionDetail,
} from '@/types/submission.types'

class SubmissionsService {
  async runCode(
    payload: RunOrSubmitPayload
  ): Promise<RunResponseWrapper['data']> {
    // Note: callers must pass `participationId` explicitly (Redux preferred).
    const res = await apiClient.post('/submissions/run', payload)
    const json = res.data as RunResponseWrapper
    if (!json?.success || !json.data?.success) {
      const message =
        (res.data && (res.data as { message?: string }).message) ||
        'Run code failed'
      throw new Error(message)
    }
    return json.data
  }

  async submitCode(payload: RunOrSubmitPayload): Promise<SubmitResponseData> {
    // Note: callers must pass `participationId` explicitly (Redux preferred).
    const res = await apiClient.post('/submissions', payload)
    const json = res.data as SubmitResponseWrapper
    if (res.status !== 201 || !json?.success) {
      const message =
        (res.data && (res.data as { message?: string }).message) ||
        'Submit failed'
      throw new Error(message)
    }
    return json.data
  }

  async getSubmission(submissionId: string): Promise<SubmissionDetail> {
    const res = await apiClient.get(`/submissions/${submissionId}`)
    const json = res.data as {
      success?: boolean
      data?: SubmissionDetail
      message?: string
    }
    if (!json?.success || !json.data) {
      throw new Error(json?.message || 'Failed to get submission')
    }
    return json.data
  }

  async getUserSubmissions(params?: {
    limit?: number
    offset?: number
    status?: string
  }): Promise<{
    submissions: SubmissionDetail[]
    total: number
    limit: number
    offset: number
  }> {
    const res = await apiClient.get('/submissions/user/my-submissions', {
      params,
    })
    console.log(res)
    const json = res.data as {
      success?: boolean
      data?: {
        submissions?: SubmissionDetail[]
        total?: number
        limit?: number
        offset?: number
      }
      message?: string
    }
    if (!json?.success || !json.data) {
      throw new Error(json?.message || 'Failed to get user submissions')
    }

    return {
      submissions: json.data.submissions || [],
      total: json.data.total || 0,
      limit: json.data.limit || (params?.limit ?? 10),
      offset: json.data.offset || (params?.offset ?? 0),
    }
  }

  async getProblemSubmissions(
    problemId: string,
    params?: {
      limit?: number
      offset?: number
      status?: string
      participationId?: string
    }
  ): Promise<{
    submissions: SubmissionDetail[]
    total: number
    limit: number
    offset: number
  }> {
    const res = await apiClient.get(`/submissions/problem/${problemId}/me`, {
      params,
    })
    const json = res.data as {
      success?: boolean
      data?: {
        submissions?: SubmissionDetail[]
        total?: number
        limit?: number
        offset?: number
      }
      message?: string
    }
    if (!json?.success || !json.data) {
      throw new Error(json?.message || 'Failed to get submissions')
    }
    return {
      submissions: json.data.submissions || [],
      total: json.data.total || 0,
      limit: json.data.limit || (params?.limit ?? 10),
      offset: json.data.offset || (params?.offset ?? 0),
    }
  }
}

export const submissionsService = new SubmissionsService()
