import { expect, test } from 'playwright/test'

import {
  createAdminExamFixture,
  ensureAuthenticatedPage,
  requireExamAccessE2EEnv,
} from './helpers/examWorkspaceFlow'

test.describe('admin results details page', () => {
  test('opens submission details in drawer', async ({ page }) => {
    const env = requireExamAccessE2EEnv()
    const exam = await createAdminExamFixture(page, env, {
      accessMode: 'open_registration',
      titlePrefix: 'E2E Results Drawer',
    })

    const leaderboardPayload = [
      {
        id: 'participation-e2e-1',
        userId: 'user-e2e-1',
        user: {
          firstname: 'Drawer',
          lastname: 'Candidate',
          email: 'drawer.candidate@example.com',
        },
        totalScore: 80,
        submittedAt: new Date().toISOString(),
      },
    ]

    await page.route(`**/api/exams/${exam.id}/leaderboard**`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: leaderboardPayload,
        }),
      })
    })

    await page.route(
      `**/api/exams/${exam.id}/participation/participation-e2e-1/submission**`,
      async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'participation-e2e-1',
              solutions: [
                {
                  challengeId: env.problemId,
                  code: 'print("drawer-test")',
                  language: 'python',
                },
              ],
            },
          }),
        })
      }
    )

    await ensureAuthenticatedPage(page, env, `/admin/exams/${exam.id}/results`)

    await expect(page.getByText('Drawer Candidate')).toBeVisible()
    await page.getByRole('button', { name: 'View details' }).click()

    await expect(page.getByText('Submission details')).toBeVisible()
    await expect(page.getByText('drawer-test')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByText('Submission details')).not.toBeVisible()
  })
})
