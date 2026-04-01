import { API_CONFIG } from '@/config/api.config'
import { apiClient } from '@/config/axios.config'
import { tokenManager } from '@/services/auth/token.service'
import type {
  RunOrSubmitPayload,
  RunResponseWrapper,
  SubmitResponseData,
  SubmitResponseWrapper,
  SubmissionDetail,
  SubmissionStreamConnection,
} from '@/types/submission.types'

class FetchSubmissionStream implements SubmissionStreamConnection {
  onmessage: ((event: MessageEvent<string>) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  private readonly abortController = new AbortController()
  private readonly decoder = new TextDecoder()
  private buffer = ''

  constructor(
    private readonly url: string,
    private readonly accessToken: string | null
  ) {
    void this.start()
  }

  close(): void {
    this.abortController.abort()
  }

  private async start(): Promise<void> {
    try {
      const response = await fetch(this.url, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          ...(this.accessToken
            ? { Authorization: `Bearer ${this.accessToken}` }
            : {}),
        },
        credentials: API_CONFIG.withCredentials ? 'include' : 'same-origin',
        cache: 'no-store',
        signal: this.abortController.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error(`Request failed with status code ${response.status}`)
      }

      const reader = response.body.getReader()
      while (!this.abortController.signal.aborted) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        this.buffer += this.decoder.decode(value, { stream: true })
        this.flushBufferedMessages()
      }
    } catch {
      if (!this.abortController.signal.aborted) {
        this.onerror?.(new Event('error'))
      }
      return
    }

    if (!this.abortController.signal.aborted) {
      this.flushBufferedMessages(true)
      this.onerror?.(new Event('error'))
    }
  }

  private flushBufferedMessages(flushRemainder = false): void {
    this.buffer = this.buffer.replace(/\r\n/g, '\n')

    let separatorIndex = this.buffer.indexOf('\n\n')
    while (separatorIndex !== -1) {
      const chunk = this.buffer.slice(0, separatorIndex)
      this.buffer = this.buffer.slice(separatorIndex + 2)
      this.emitChunk(chunk)
      separatorIndex = this.buffer.indexOf('\n\n')
    }

    if (flushRemainder && this.buffer.trim().length > 0) {
      this.emitChunk(this.buffer)
      this.buffer = ''
    }
  }

  private emitChunk(chunk: string): void {
    const data = chunk
      .split('\n')
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trimStart())
      .join('\n')

    if (!data) {
      return
    }

    this.onmessage?.(new MessageEvent('message', { data }))
  }
}

class SubmissionsService {
  async runCode(
    payload: RunOrSubmitPayload
  ): Promise<RunResponseWrapper['data']> {
    // Note: callers must pass `participationId` explicitly (Redux preferred).
    const res = await apiClient.post('/submissions/run', payload)
    const json = res.data as RunResponseWrapper
    if (!json?.success || !json.data?.submissionId) {
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
    const wrapped = res.data as {
      success?: boolean
      data?: SubmissionDetail
      message?: string
    }

    if (wrapped?.success && wrapped.data) {
      return wrapped.data
    }

    const direct = res.data as Partial<SubmissionDetail>
    if (direct?.submissionId && direct?.status) {
      return direct as SubmissionDetail
    }

    throw new Error(wrapped?.message || 'Failed to get submission')
  }

  buildSubmissionStreamUrl(submissionId: string): string {
    const baseUrl = API_CONFIG.baseURL.replace(/\/+$/, '')
    const streamUrl = new URL(`${baseUrl}/submissions/stream/${submissionId}`)
    const accessToken = tokenManager.getAccessToken()

    if (accessToken) {
      streamUrl.searchParams.set('token', accessToken)
    }

    return streamUrl.toString()
  }

  createSubmissionEventSource(
    submissionId: string
  ): SubmissionStreamConnection {
    return new FetchSubmissionStream(
      this.buildSubmissionStreamUrl(submissionId),
      tokenManager.getAccessToken()
    )
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
    const wrapped = res.data as {
      success?: boolean
      data?: {
        submissions?: SubmissionDetail[]
        total?: number
        limit?: number
        offset?: number
      }
      message?: string
    }
    const data = wrapped?.success ? wrapped.data : res.data

    if (!data || typeof data !== 'object') {
      throw new Error(wrapped?.message || 'Failed to get user submissions')
    }

    const parsed = data as {
      submissions?: SubmissionDetail[]
      total?: number
      limit?: number
      offset?: number
    }

    return {
      submissions: parsed.submissions || [],
      total: parsed.total || 0,
      limit: parsed.limit || (params?.limit ?? 10),
      offset: parsed.offset || (params?.offset ?? 0),
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
    const wrapped = res.data as {
      success?: boolean
      data?: {
        submissions?: SubmissionDetail[]
        total?: number
        limit?: number
        offset?: number
        pagination?: {
          total?: number
          limit?: number
          page?: number
        }
      }
      message?: string
    }
    const data = wrapped?.success ? wrapped.data : res.data

    if (!data || typeof data !== 'object') {
      throw new Error(wrapped?.message || 'Failed to get submissions')
    }

    const parsed = data as {
      submissions?: SubmissionDetail[]
      total?: number
      limit?: number
      offset?: number
      pagination?: {
        total?: number
        limit?: number
        page?: number
      }
    }

    const paginationOffset =
      parsed.offset ??
      (parsed.pagination && parsed.pagination.page && parsed.pagination.limit
        ? (parsed.pagination.page - 1) * parsed.pagination.limit
        : undefined)

    return {
      submissions: parsed.submissions || [],
      total: parsed.total ?? parsed.pagination?.total ?? 0,
      limit: parsed.limit ?? parsed.pagination?.limit ?? params?.limit ?? 10,
      offset: paginationOffset ?? params?.offset ?? 0,
    }
  }
}

export const submissionsService = new SubmissionsService()
