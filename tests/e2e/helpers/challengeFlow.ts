/// <reference types="node" />

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { expect, type Locator, type Page, type Response } from 'playwright/test'

type ChallengeE2EEnv = {
  email: string
  password: string
  sourceCode: string
  targetPath: string
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function normalizeSourceCode(sourceCode: string): string {
  return sourceCode.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
}

function readSourceCode(): string {
  const inlineSource = process.env.PLAYWRIGHT_E2E_SOURCE_CODE
  if (inlineSource && inlineSource.trim().length > 0) {
    return normalizeSourceCode(inlineSource)
  }

  const sourceFile = process.env.PLAYWRIGHT_E2E_SOURCE_FILE?.trim()
  if (!sourceFile) {
    throw new Error(
      'Missing source code. Set PLAYWRIGHT_E2E_SOURCE_CODE or PLAYWRIGHT_E2E_SOURCE_FILE.'
    )
  }

  const resolvedPath = path.isAbsolute(sourceFile)
    ? sourceFile
    : path.resolve(process.cwd(), sourceFile)

  return normalizeSourceCode(fs.readFileSync(resolvedPath, 'utf8'))
}

function getTargetPath(): string {
  const explicitPath = process.env.PLAYWRIGHT_E2E_CHALLENGE_PATH?.trim()
  if (explicitPath) {
    return explicitPath
  }

  const problemId = requireEnv('PLAYWRIGHT_E2E_PROBLEM_ID')
  return `/problems/${problemId}`
}

function isRunSubmissionRequest(response: Response): boolean {
  const request = response.request()
  const pathname = new URL(response.url()).pathname
  return request.method() === 'POST' && pathname.endsWith('/api/submissions/run')
}

function isSubmitSubmissionRequest(response: Response): boolean {
  const request = response.request()
  const pathname = new URL(response.url()).pathname
  return request.method() === 'POST' && pathname.endsWith('/api/submissions')
}

async function waitForOptionalVisible(locator: Locator, timeout = 5000) {
  try {
    await locator.first().waitFor({ state: 'visible', timeout })
  } catch {
    // Fast responses can replace the loading state before Playwright observes it.
  }
}

async function completeLogin(page: Page, env: ChallengeE2EEnv) {
  await expect(page.getByLabel('Email')).toBeVisible({ timeout: 20000 })
  await page.getByLabel('Email').fill(env.email)
  await page.getByLabel('Password').fill(env.password)

  await Promise.all([
    page.waitForURL(url => {
      const target = new URL(env.targetPath, 'http://playwright.local')
      return url.pathname === target.pathname && url.search === target.search
    }),
    page.getByRole('button', { name: 'Sign in' }).click(),
  ])
}

async function trySetMonacoModelValue(page: Page, sourceCode: string) {
  return page.evaluate(value => {
    const monaco = (window as typeof window & {
      monaco?: {
        editor?: {
          getModels?: () => Array<{
            getValue?: () => string
            setValue?: (nextValue: string) => void
          }>
        }
      }
    }).monaco

    const model = monaco?.editor?.getModels?.()[0]
    if (!model || typeof model.setValue !== 'function') {
      return false
    }

    model.setValue(value)
    return typeof model.getValue === 'function'
      ? model.getValue() === value
      : true
  }, sourceCode)
}

async function readMonacoModelValue(page: Page) {
  return page.evaluate(() => {
    const monaco = (window as typeof window & {
      monaco?: {
        editor?: {
          getModels?: () => Array<{
            getValue?: () => string
          }>
        }
      }
    }).monaco

    const model = monaco?.editor?.getModels?.()[0]
    return typeof model?.getValue === 'function' ? model.getValue() : null
  })
}

export function requireChallengeE2EEnv(): ChallengeE2EEnv {
  return {
    email: requireEnv('PLAYWRIGHT_E2E_EMAIL'),
    password: requireEnv('PLAYWRIGHT_E2E_PASSWORD'),
    sourceCode: readSourceCode(),
    targetPath: getTargetPath(),
  }
}

export async function ensureChallengeSession(page: Page, env: ChallengeE2EEnv) {
  await page.goto(env.targetPath)

  const redirectedToLogin = await Promise.race([
    page
      .waitForURL('**/login', { timeout: 15000 })
      .then(() => true)
      .catch(() => false),
    page
      .getByRole('button', { name: 'Run' })
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => false)
      .catch(() => false),
  ])

  if (redirectedToLogin || new URL(page.url()).pathname === '/login') {
    await completeLogin(page, env)
  }

  await expect(page.getByRole('button', { name: 'Run' })).toBeVisible({
    timeout: 20000,
  })
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible({
    timeout: 20000,
  })
  await expect(page.locator('.monaco-editor').first()).toBeVisible({
    timeout: 20000,
  })
}

export async function replaceMonacoEditorContent(
  page: Page,
  sourceCode: string
) {
  const editor = page.locator('.monaco-editor').first()
  await expect(editor).toBeVisible({ timeout: 20000 })

  const normalizedSourceCode = normalizeSourceCode(sourceCode)
  const updatedWithMonacoModel = await trySetMonacoModelValue(
    page,
    normalizedSourceCode
  )

  if (!updatedWithMonacoModel) {
    const input = page.locator('.monaco-editor textarea').first()
    await input.click({ force: true })
    await page.keyboard.press('ControlOrMeta+A')
    await page.keyboard.press('Delete')
    await page.keyboard.insertText(normalizedSourceCode)
  }

  await expect
    .poll(() => readMonacoModelValue(page), {
      timeout: 10000,
      message: 'Expected Monaco model to contain the replacement source code.',
    })
    .toBe(normalizedSourceCode)
}

export async function clickRunAndWaitForCompletion(page: Page) {
  const runResponsePromise = page.waitForResponse(isRunSubmissionRequest)
  await page.getByRole('button', { name: 'Run' }).click()
  await waitForOptionalVisible(page.getByText('Running tests...'))

  const runResponse = await runResponsePromise
  expect(runResponse.ok()).toBeTruthy()
}

export async function clickSubmitAndWaitForCompletion(page: Page) {
  const submitResponsePromise = page.waitForResponse(isSubmitSubmissionRequest)
  await page.getByRole('button', { name: 'Submit' }).click()
  await waitForOptionalVisible(page.getByText('Submitting...'))

  const submitResponse = await submitResponsePromise
  expect(submitResponse.status()).toBe(201)
}