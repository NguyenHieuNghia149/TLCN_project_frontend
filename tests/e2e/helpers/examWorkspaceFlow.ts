/// <reference types="node" />

import process from 'node:process'

import { expect, type APIResponse, type Page } from 'playwright/test'

type ExamAccessMode = 'open_registration' | 'invite_only' | 'hybrid'

type AdminExamFixture = {
  id: string
  slug: string
  status?: string
}

export type ExamWorkspaceE2EEnv = {
  email: string
  password: string
  problemId: string
  apiBaseUrl: string
  targetPath: string | null
  examSlug: string | null
  examChallengeId: string | null
}

let cachedWorkspacePathPromise: Promise<string> | null = null
const apiTokenCache = new Map<string, string>()

function readTrimmedEnv(name: string): string {
  return process.env[name]?.trim() || ''
}

function normalizeApiBaseUrl(value: string): string {
  const fallback = 'http://localhost:3001/api'
  const resolved = value || fallback
  return resolved.endsWith('/') ? resolved.slice(0, -1) : resolved
}

function resolveTargetPath(): string | null {
  const explicitPath = readTrimmedEnv('PLAYWRIGHT_E2E_EXAM_WORKSPACE_PATH')
  if (explicitPath) {
    return explicitPath
  }

  const examSlug = readTrimmedEnv('PLAYWRIGHT_E2E_EXAM_SLUG')
  const challengeId = readTrimmedEnv('PLAYWRIGHT_E2E_EXAM_CHALLENGE_ID')
  if (examSlug && challengeId) {
    return `/exam/${examSlug}/challenges/${challengeId}`
  }

  return null
}

export function getMissingExamWorkspaceEnvMessage(): string {
  return (
    'Missing exam workspace e2e env. Set PLAYWRIGHT_E2E_EMAIL, PLAYWRIGHT_E2E_PASSWORD and ' +
    'PLAYWRIGHT_E2E_PROBLEM_ID (for deterministic exam bootstrap). Optionally provide ' +
    'PLAYWRIGHT_E2E_EXAM_WORKSPACE_PATH or PLAYWRIGHT_E2E_EXAM_SLUG + PLAYWRIGHT_E2E_EXAM_CHALLENGE_ID. ' +
    'You can also set PLAYWRIGHT_E2E_ACCESS_TOKEN to bypass login throttling.'
  )
}

export function getExamWorkspaceE2EEnv(): ExamWorkspaceE2EEnv | null {
  const email = readTrimmedEnv('PLAYWRIGHT_E2E_EMAIL')
  const password = readTrimmedEnv('PLAYWRIGHT_E2E_PASSWORD')
  const problemId = readTrimmedEnv('PLAYWRIGHT_E2E_PROBLEM_ID')
  const apiBaseUrl = normalizeApiBaseUrl(
    readTrimmedEnv('PLAYWRIGHT_E2E_API_BASE_URL')
  )
  const targetPath = resolveTargetPath()
  const examSlug = readTrimmedEnv('PLAYWRIGHT_E2E_EXAM_SLUG') || null
  const examChallengeId =
    readTrimmedEnv('PLAYWRIGHT_E2E_EXAM_CHALLENGE_ID') || null

  if (!email || !password || !problemId) {
    return null
  }

  return {
    email,
    password,
    problemId,
    apiBaseUrl,
    targetPath,
    examSlug,
    examChallengeId,
  }
}

export function requireExamWorkspaceE2EEnv(): ExamWorkspaceE2EEnv {
  const env = getExamWorkspaceE2EEnv()
  if (!env) {
    throw new Error(getMissingExamWorkspaceEnvMessage())
  }
  return env
}

export function requireExamAccessE2EEnv(): ExamWorkspaceE2EEnv {
  return requireExamWorkspaceE2EEnv()
}

function authHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }
}

function decodeAccessTokenPayload(token: string): {
  userId?: string
  email?: string
  role?: string
} {
  try {
    const tokenParts = token.split('.')
    if (tokenParts.length < 2) {
      return {}
    }

    const base64Url = tokenParts[1]
    if (!base64Url) {
      return {}
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const decoded = Buffer.from(padded, 'base64').toString('utf8')
    const parsed = JSON.parse(decoded) as {
      userId?: string
      email?: string
      role?: string
    }

    return parsed || {}
  } catch {
    return {}
  }
}

function toSlug(prefix: string): string {
  return prefix
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function parseResponseBody(response: APIResponse): Promise<unknown> {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function extractPayload<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const nested = (raw as { data?: unknown }).data
    if (nested !== undefined && nested !== null) {
      return nested as T
    }
  }
  return raw as T
}

async function assertOk(
  response: APIResponse,
  action: string
): Promise<unknown> {
  const body = await parseResponseBody(response)
  if (response.ok()) {
    return body
  }

  throw new Error(
    `${action} failed (${response.status()} ${response.statusText()}): ${JSON.stringify(body)}`
  )
}

async function getApiAccessToken(
  page: Page,
  env: ExamWorkspaceE2EEnv
): Promise<string> {
  const preconfiguredToken = readTrimmedEnv('PLAYWRIGHT_E2E_ACCESS_TOKEN')
  if (preconfiguredToken) {
    return preconfiguredToken
  }

  const cacheKey = `${env.apiBaseUrl}|${env.email}`
  const cached = apiTokenCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const loginResponse = await page.request.post(
    `${env.apiBaseUrl}/auth/login`,
    {
      data: {
        email: env.email,
        password: env.password,
      },
    }
  )
  const rawBody = await assertOk(loginResponse, 'E2E login')
  const loginPayload = extractPayload<Record<string, unknown>>(rawBody)
  const tokens =
    (loginPayload.tokens as Record<string, unknown> | undefined) ||
    ((loginPayload.data as { tokens?: Record<string, unknown> } | undefined)
      ?.tokens ??
      undefined)

  const accessToken =
    (typeof tokens?.accessToken === 'string' && tokens.accessToken) ||
    (typeof (loginPayload.accessToken as string | undefined) === 'string'
      ? (loginPayload.accessToken as string)
      : '')

  if (!accessToken) {
    throw new Error(
      `Unable to resolve access token from login payload: ${JSON.stringify(rawBody)}`
    )
  }

  apiTokenCache.set(cacheKey, accessToken)
  return accessToken
}

async function publishExamIfNeeded(
  page: Page,
  env: ExamWorkspaceE2EEnv,
  exam: AdminExamFixture,
  accessToken: string
): Promise<AdminExamFixture> {
  if (exam.status === 'published') {
    return exam
  }

  const publishResponse = await page.request.post(
    `${env.apiBaseUrl}/admin/exams/${exam.id}/publish`,
    {
      headers: authHeaders(accessToken),
    }
  )
  const publishRaw = await assertOk(publishResponse, 'Publish exam fixture')
  const publishedExam = extractPayload<AdminExamFixture>(publishRaw)

  return {
    id: publishedExam.id,
    slug: publishedExam.slug || exam.slug,
    status: publishedExam.status,
  }
}

async function ensureLegacySession(
  page: Page,
  env: ExamWorkspaceE2EEnv,
  examId: string,
  accessToken: string
): Promise<void> {
  const sessionResponse = await page.request.get(
    `${env.apiBaseUrl}/exams/${examId}/session`,
    {
      headers: authHeaders(accessToken),
    }
  )
  await assertOk(sessionResponse, 'Create exam workspace session')
}

async function resolveWorkspaceTargetPath(
  page: Page,
  env: ExamWorkspaceE2EEnv
): Promise<string> {
  if (env.targetPath) {
    return env.targetPath
  }

  if (env.examSlug && env.examChallengeId) {
    return `/exam/${env.examSlug}/challenges/${env.examChallengeId}`
  }

  if (!cachedWorkspacePathPromise) {
    cachedWorkspacePathPromise = (async () => {
      const exam = await createAdminExamFixture(page, env, {
        accessMode: 'open_registration',
        titlePrefix: 'E2E Mobile Workspace',
      })
      const accessToken = await getApiAccessToken(page, env)
      await ensureLegacySession(page, env, exam.id, accessToken)

      const challengeId = env.examChallengeId || env.problemId
      return `/exam/${exam.slug}/challenges/${challengeId}`
    })()
  }

  return cachedWorkspacePathPromise
}

function targetPathPattern(targetPath: string): RegExp {
  const target = new URL(targetPath, 'http://playwright.local')
  const escapedPath = target.pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const escapedSearch = target.search
    ? target.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    : ''

  return new RegExp(`${escapedPath}${escapedSearch}$`)
}

async function completeLogin(
  page: Page,
  env: ExamWorkspaceE2EEnv,
  targetPath: string
) {
  const target = new URL(targetPath, 'http://playwright.local')
  await expect(page.getByLabel('Email')).toBeVisible({ timeout: 20000 })
  await page.getByLabel('Email').fill(env.email)
  await page.getByLabel('Password').fill(env.password)
  await Promise.all([
    page.waitForURL(url => {
      return url.pathname === target.pathname
    }),
    page.getByRole('button', { name: 'Sign in' }).click(),
  ])
}

async function primeAuthenticatedBrowserSession(
  page: Page,
  env: ExamWorkspaceE2EEnv
): Promise<void> {
  const accessToken = await getApiAccessToken(page, env)
  const payload = decodeAccessTokenPayload(accessToken)
  const user = {
    id: payload.userId || 'playwright-e2e-user',
    email: payload.email || env.email,
    firstName: 'E2E',
    lastName: 'Teacher',
    role: payload.role || 'teacher',
    status: 'active',
    rankingPoint: 0,
    rank: null,
    avatar: null,
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }

  await page.route('**/api/auth/refresh-token', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          tokens: {
            accessToken,
          },
          user,
        },
      }),
    })
  })

  await page.route('**/api/auth/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: user,
      }),
    })
  })

  await page.addInitScript(() => {
    window.localStorage.setItem('auth_is_authenticated', 'true')
  })
}

export async function ensureAuthenticatedPage(
  page: Page,
  env: ExamWorkspaceE2EEnv,
  targetPath: string
) {
  const target = new URL(targetPath, 'http://playwright.local')

  await primeAuthenticatedBrowserSession(page, env)
  await page.goto(targetPath)
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(600)

  let currentPathname = new URL(page.url()).pathname
  if (currentPathname === '/login') {
    await completeLogin(page, env, targetPath)
    await page.waitForURL(url => url.pathname === target.pathname, {
      timeout: 30000,
    })
    return
  }

  // Account for delayed route guards that redirect after the first render.
  const redirectedToLogin = await page
    .waitForURL('**/login', { timeout: 6000 })
    .then(() => true)
    .catch(() => false)

  if (redirectedToLogin) {
    await completeLogin(page, env, targetPath)
    await page.waitForURL(url => url.pathname === target.pathname, {
      timeout: 30000,
    })
    return
  }

  currentPathname = new URL(page.url()).pathname
  if (currentPathname !== target.pathname) {
    await page.goto(targetPath)
    await page.waitForURL(targetPathPattern(targetPath), { timeout: 30000 })
  }
}

export async function createAdminExamFixture(
  page: Page,
  env: ExamWorkspaceE2EEnv,
  options: {
    accessMode?: ExamAccessMode
    titlePrefix?: string
  } = {}
): Promise<AdminExamFixture> {
  const accessToken = await getApiAccessToken(page, env)
  const now = Date.now()
  const slugPrefix = toSlug(options.titlePrefix || 'E2E Exam')
  const slug = `${slugPrefix}-${now}-${Math.floor(Math.random() * 10_000)}`
  const title = options.titlePrefix
    ? `${options.titlePrefix} ${now}`
    : `E2E Exam ${now}`
  const accessMode = options.accessMode || 'open_registration'

  const createPayload = {
    title,
    slug,
    duration: 60,
    startDate: new Date(now + 60_000).toISOString(),
    endDate: new Date(now + 3_600_000).toISOString(),
    isVisible: true,
    maxAttempts: 1,
    accessMode,
    selfRegistrationApprovalMode: accessMode === 'invite_only' ? null : 'auto',
    selfRegistrationPasswordRequired: false,
    allowExternalCandidates: true,
    registrationOpenAt: null,
    registrationCloseAt: null,
    challenges: [
      {
        type: 'existing',
        challengeId: env.problemId,
        orderIndex: 0,
      },
    ],
  }

  const createResponse = await page.request.post(
    `${env.apiBaseUrl}/admin/exams`,
    {
      headers: authHeaders(accessToken),
      data: createPayload,
    }
  )
  const createRaw = await assertOk(createResponse, 'Create admin exam fixture')
  const created = extractPayload<AdminExamFixture>(createRaw)

  if (!created?.id || !created?.slug) {
    throw new Error(
      `Unexpected exam fixture response shape: ${JSON.stringify(createRaw)}`
    )
  }

  return publishExamIfNeeded(page, env, created, accessToken)
}

export async function ensureExamWorkspaceSession(
  page: Page,
  env: ExamWorkspaceE2EEnv
) {
  const targetPath = await resolveWorkspaceTargetPath(page, env)
  await ensureAuthenticatedPage(page, env, targetPath)

  await expect(page.getByText(/Time remaining:/i)).toBeVisible({
    timeout: 30000,
  })
  await expect(
    page.getByRole('button', { name: 'View All Challenges' })
  ).toBeVisible({
    timeout: 20000,
  })
}
