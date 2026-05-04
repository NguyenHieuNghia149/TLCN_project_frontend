/// <reference types="node" />

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import dotenv from 'dotenv'
import { defineConfig } from 'playwright/test'

dotenv.config({
  path: path.resolve(process.cwd(), '.env.playwright.local'),
  quiet: true,
})

const frontendPort = Number(process.env.PLAYWRIGHT_FRONTEND_PORT ?? 3000)
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${frontendPort}`
const workersFromEnv = Number(process.env.PLAYWRIGHT_WORKERS ?? '1')

const browserExecutableCandidates = [
  process.env.PLAYWRIGHT_BROWSER_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter((candidate): candidate is string => Boolean(candidate))

const executablePath = browserExecutableCandidates.find(candidate =>
  fs.existsSync(candidate)
)

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers:
    Number.isFinite(workersFromEnv) && workersFromEnv > 0 ? workersFromEnv : 1,
  reporter: process.env.CI
    ? [
        ['list'],
        ['html', { open: 'never', outputFolder: 'output/playwright/report' }],
      ]
    : 'list',
  outputDir: 'output/playwright/test-results',
  use: {
    baseURL,
    headless: process.env.PLAYWRIGHT_HEADED === '1' ? false : true,
    launchOptions: executablePath
      ? {
          executablePath,
        }
      : undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --host localhost --port ${frontendPort}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
