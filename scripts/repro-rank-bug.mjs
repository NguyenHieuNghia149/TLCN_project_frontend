import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import dotenv from 'dotenv'
import { chromium } from 'playwright'

dotenv.config({
  path: path.resolve(process.cwd(), '.env.playwright.local'),
  quiet: true,
})

const browserExecutableCandidates = [
  process.env.PLAYWRIGHT_BROWSER_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean)

const executablePath = browserExecutableCandidates.find(candidate =>
  fs.existsSync(candidate)
)

const browser = await chromium.launch({
  headless: true,
  executablePath,
})
const page = await browser.newPage()
const captures = []

page.on('response', async response => {
  const url = response.url()
  if (
    !url.includes('/challenges/problems/topic/') &&
    !url.includes('/leaderboard/user/')
  ) {
    return
  }

  let body = ''
  try {
    body = await response.text()
  } catch {
    body = ''
  }

  captures.push({
    url,
    status: response.status(),
    body,
  })
})

try {
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' })
  await page.getByLabel('Email').fill(process.env.PLAYWRIGHT_E2E_EMAIL ?? '')
  await page.getByLabel('Password').fill(
    process.env.PLAYWRIGHT_E2E_PASSWORD ?? ''
  )

  await Promise.all([
    page.waitForURL('**/dashboard'),
    page.getByRole('button', { name: 'Sign in' }).click(),
  ])

  await page.waitForLoadState('networkidle')

  const hrefs = await page
    .locator("a[href*='/dashboard/challenge/']")
    .evaluateAll(nodes =>
      nodes
        .map(node => node.getAttribute('href'))
        .filter(href => typeof href === 'string' && href.length > 0)
    )

  const target =
    hrefs.find(href => href.toLowerCase().includes('category=algorithms')) ||
    hrefs[0] ||
    null

  console.log(
    JSON.stringify(
      {
        phase: 'dashboard-links',
        hrefs,
        target,
      },
      null,
      2
    )
  )

  if (!target) {
    throw new Error('No challenge topic links found on dashboard')
  }

  await page.goto(new URL(target, 'http://localhost:3000').toString(), {
    waitUntil: 'networkidle',
  })
  await page.waitForTimeout(3000)

  const bodyText = await page.locator('body').innerText()
  const rankCardText = await page
    .getByText('Rank', { exact: true })
    .locator('..')
    .innerText()
    .catch(() => null)
  const pointsCardText = await page
    .getByText('Points', { exact: true })
    .locator('..')
    .innerText()
    .catch(() => null)

  console.log(
    JSON.stringify(
      {
        phase: 'challenge-page',
        url: page.url(),
        hasKeepGoing: bodyText.includes('Keep going'),
        rankCardText,
        pointsCardText,
        captures,
      },
      null,
      2
    )
  )
} finally {
  await browser.close()
}
