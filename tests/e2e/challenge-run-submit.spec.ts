import { expect, test } from 'playwright/test'

import {
  clickSubmitAndWaitForCompletion,
  clickRunAndWaitForCompletion,
  ensureChallengeSession,
  replaceMonacoEditorContent,
  requireChallengeE2EEnv,
} from './helpers/challengeFlow'

test.describe('challenge run and submit flow', () => {
  test('runs code and submits code from the challenge detail page', async ({
    page,
  }) => {
    const env = requireChallengeE2EEnv()

    await ensureChallengeSession(page, env)
    await replaceMonacoEditorContent(page, env.sourceCode)

    await clickRunAndWaitForCompletion(page)
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()

    await clickSubmitAndWaitForCompletion(page)
    await expect(page.getByText(/Accepted/).first()).toBeVisible({
      timeout: 60000,
    })
  })
})