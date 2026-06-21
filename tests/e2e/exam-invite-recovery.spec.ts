import { expect, test } from 'playwright/test'

import {
  createAdminExamFixture,
  requireExamAccessE2EEnv,
} from './helpers/examWorkspaceFlow'

test.describe('exam invite recovery flow', () => {
  test('shows invite-expired panel and recovers to landing route', async ({
    page,
  }) => {
    const env = requireExamAccessE2EEnv()
    const exam = await createAdminExamFixture(page, env, {
      accessMode: 'invite_only',
      titlePrefix: 'E2E Invite Recovery',
    })

    await page.goto(`/exam/${exam.slug}/entry?invite=expired-token-for-e2e`)

    await expect(
      page.getByRole('heading', { name: 'Invite link is invalid or expired' })
    ).toBeVisible()
    await page.getByRole('button', { name: 'Request new invite' }).click()

    await expect(page).toHaveURL(new RegExp(`/exam/${exam.slug}$`))
  })
})
