import { expect, test, type APIRequestContext } from 'playwright/test'

type LiveStackEnv = {
  apiBaseUrl: string
  serverAiUrl: string
  email: string
  password: string
  accessToken: string | null
  examId: string
  participationId: string
  modelVersion: string
  recordReviewLabel: boolean
}

function readEnv(name: string): string {
  return process.env[name]?.trim() || ''
}

function normalizeBaseUrl(value: string, fallback: string): string {
  const resolved = value || fallback
  return resolved.endsWith('/') ? resolved.slice(0, -1) : resolved
}

function getLiveStackEnv(): LiveStackEnv | null {
  const accessToken = readEnv('PLAYWRIGHT_E2E_ACCESS_TOKEN') || null
  const email = readEnv('PLAYWRIGHT_E2E_EMAIL')
  const password = readEnv('PLAYWRIGHT_E2E_PASSWORD')
  const examId = readEnv('PLAYWRIGHT_E2E_PROCTORING_EXAM_ID')
  const participationId = readEnv('PLAYWRIGHT_E2E_PROCTORING_PARTICIPATION_ID')
  const modelVersion = readEnv('PLAYWRIGHT_E2E_PROCTORING_MODEL_VERSION')

  if ((!accessToken && (!email || !password)) || !examId || !participationId || !modelVersion) {
    return null
  }

  return {
    apiBaseUrl: normalizeBaseUrl(
      readEnv('PLAYWRIGHT_E2E_API_BASE_URL'),
      'http://localhost:3001/api'
    ),
    serverAiUrl: normalizeBaseUrl(
      readEnv('PLAYWRIGHT_E2E_SERVER_AI_URL'),
      'http://localhost:8001'
    ),
    email,
    password,
    accessToken,
    examId,
    participationId,
    modelVersion,
    recordReviewLabel: readEnv('PLAYWRIGHT_E2E_RECORD_REVIEW_LABEL') === '1',
  }
}

function unwrapData<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data
  }
  return body as T
}

async function resolveAccessToken(request: APIRequestContext, env: LiveStackEnv) {
  if (env.accessToken) {
    return env.accessToken
  }

  const response = await request.post(`${env.apiBaseUrl}/auth/login`, {
    data: {
      email: env.email,
      password: env.password,
    },
  })
  expect(response.ok(), await response.text()).toBe(true)
  const payload = unwrapData<Record<string, unknown>>(await response.json())
  const tokens = payload.tokens as { accessToken?: string } | undefined
  expect(tokens?.accessToken).toBeTruthy()
  return tokens!.accessToken!
}

test.describe('proctoring live-stack admin gate', () => {
  test('verifies deterministic review and advisory gates against real API, worker data, server-ai, and browser harness', async ({
    page,
  }) => {
    const env = getLiveStackEnv()
    test.skip(
      !env,
      'Set PLAYWRIGHT_E2E_ACCESS_TOKEN or PLAYWRIGHT_E2E_EMAIL/PASSWORD, plus PLAYWRIGHT_E2E_PROCTORING_EXAM_ID, PLAYWRIGHT_E2E_PROCTORING_PARTICIPATION_ID, and PLAYWRIGHT_E2E_PROCTORING_MODEL_VERSION.'
    )

    const serverAiHealth = await page.request.get(`${env!.serverAiUrl}/healthz`)
    expect(serverAiHealth.ok(), await serverAiHealth.text()).toBe(true)
    await expect(await serverAiHealth.json()).toMatchObject({
      status: 'ok',
      service: 'server-ai',
    })

    const accessToken = await resolveAccessToken(page.request, env!)
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }

    const reviewResponse = await page.request.get(
      `${env!.apiBaseUrl}/admin/exams/${env!.examId}/participations/${env!.participationId}/proctoring`,
      { headers }
    )
    expect(reviewResponse.ok(), await reviewResponse.text()).toBe(true)
    const review = unwrapData<Record<string, any>>(await reviewResponse.json())

    expect(review.summary).toBeTruthy()
    expect(review.summary.reviewerDecision).toBeTruthy()
    expect(review.aiAdvisory).toMatchObject({
      visible: false,
    })
    expect(JSON.stringify(review)).not.toMatch(/rawClipboard|sourceCode|rawPrompt|rawProviderResponse/i)
    expect(review.llmSummary).toBeUndefined()

    if (env!.recordReviewLabel) {
      const labelResponse = await page.request.post(
        `${env!.apiBaseUrl}/admin/exams/${env!.examId}/participations/${env!.participationId}/proctoring/labels`,
        {
          headers,
          data: {
            reviewOutcome: 'no_action_needed',
            evidenceConfidence: 'high',
            notes: 'Live-stack pilot label captured by Playwright admin gate.',
          },
        }
      )
      expect(labelResponse.ok(), await labelResponse.text()).toBe(true)
    }
  })
})
