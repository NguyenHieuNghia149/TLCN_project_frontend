import { expect, test } from 'playwright/test'

import {
  ensureExamWorkspaceSession,
  requireExamWorkspaceE2EEnv,
} from './helpers/examWorkspaceFlow'

test.describe('exam workspace mobile layout', () => {
  test.use({
    viewport: {
      width: 390,
      height: 844,
    },
  })

  test('shows tabbed mobile workspace and bottom-sheet challenge picker', async ({
    page,
  }) => {
    const env = requireExamWorkspaceE2EEnv()

    await ensureExamWorkspaceSession(page, env)

    const timerText = page.getByText(/Time remaining:/i)
    await expect(timerText).toBeVisible()
    await page.mouse.wheel(0, 600)
    await expect(timerText).toBeVisible()

    await expect(page.getByRole('button', { name: 'Problem' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Editor' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Output' })).toBeVisible()
    const challengesTab = page.getByRole('button', {
      name: 'Challenges',
      exact: true,
    })
    await expect(challengesTab).toBeVisible()

    await page.getByRole('button', { name: 'Editor' }).click()
    await expect(page.locator('.monaco-editor').first()).toBeVisible()

    await challengesTab.click()
    await expect(
      page.getByRole('heading', { name: 'All Challenges', exact: true })
    ).toBeVisible()
    await expect(page.getByText('Navigation')).toBeVisible()
  })
})
