import { submissionsService } from '@/services/api/submissions.service'
import { tokenManager } from '@/services/auth/token.service'
import { afterEach, describe, expect, it } from 'vitest'

afterEach(() => {
  tokenManager.clearAccessToken()
})

describe('submissionsService stream url', () => {
  it('appends the in-memory access token for SSE auth', () => {
    tokenManager.setAccessToken('test-token')

    const url = new URL(
      submissionsService.buildSubmissionStreamUrl('submission-123')
    )

    expect(url.pathname).toBe('/api/submissions/stream/submission-123')
    expect(url.searchParams.get('token')).toBe('test-token')
  })

  it('omits the token query when no access token is present', () => {
    const url = new URL(
      submissionsService.buildSubmissionStreamUrl('submission-123')
    )

    expect(url.pathname).toBe('/api/submissions/stream/submission-123')
    expect(url.searchParams.has('token')).toBe(false)
  })
})
