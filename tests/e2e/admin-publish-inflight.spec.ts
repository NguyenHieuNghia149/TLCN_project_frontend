import { expect, test } from 'playwright/test'

import {
  ensureAuthenticatedPage,
  requireExamAccessE2EEnv,
} from './helpers/examWorkspaceFlow'

test.describe('admin publish in-flight state', () => {
  test('locks publish actions while one publish request is pending', async ({
    page,
  }) => {
    const env = requireExamAccessE2EEnv()
    const firstExamId = '11111111-1111-4111-8111-111111111111'
    const secondExamId = '22222222-2222-4222-8222-222222222222'

    await page.route('**/api/admin/exams**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: firstExamId,
                title: 'Draft Exam A',
                slug: 'draft-exam-a',
                status: 'draft',
                accessMode: 'open_registration',
                duration: 60,
                maxAttempts: 1,
                startDate: new Date(Date.now() + 3600_000).toISOString(),
                endDate: new Date(Date.now() + 7200_000).toISOString(),
                isVisible: true,
              },
              {
                id: secondExamId,
                title: 'Draft Exam B',
                slug: 'draft-exam-b',
                status: 'draft',
                accessMode: 'invite_only',
                duration: 60,
                maxAttempts: 1,
                startDate: new Date(Date.now() + 3600_000).toISOString(),
                endDate: new Date(Date.now() + 7200_000).toISOString(),
                isVisible: true,
              },
            ],
            total: 2,
          }),
        })
        return
      }

      await route.continue()
    })

    await page.route(
      `**/api/admin/exams/${firstExamId}/publish`,
      async route => {
        await new Promise(resolve => setTimeout(resolve, 1200))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: firstExamId,
            title: 'Draft Exam A',
            slug: 'draft-exam-a',
            status: 'published',
            accessMode: 'open_registration',
            duration: 60,
            maxAttempts: 1,
            startDate: new Date(Date.now() + 3600_000).toISOString(),
            endDate: new Date(Date.now() + 7200_000).toISOString(),
            isVisible: true,
          }),
        })
      }
    )

    await ensureAuthenticatedPage(page, env, '/admin/exams')

    const publishA = page.getByRole('button', {
      name: 'Publish exam Draft Exam A',
    })
    const publishB = page.getByRole('button', {
      name: 'Publish exam Draft Exam B',
    })

    await publishA.click()
    await expect(publishA).toBeDisabled()
    await expect(publishB).toBeDisabled()

    await expect(page.getByText('Exam published successfully')).toBeVisible()
  })
})
