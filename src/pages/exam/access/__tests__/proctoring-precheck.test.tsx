// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ProctoringConsentPanel from '@/pages/exam/access/components/ProctoringConsentPanel'
import ProctoringPrecheckPanel from '@/pages/exam/access/components/ProctoringPrecheckPanel'

describe('candidate proctoring access panels', () => {
  afterEach(() => {
    cleanup()
  })

  it('requires explicit consent before precheck can run', async () => {
    const onAccept = vi.fn()
    const onRunPrecheck = vi.fn()
    const user = userEvent.setup()

    const { rerender } = render(
      <>
        <ProctoringConsentPanel
          settings={{
            enabled: true,
            requireCamera: true,
            requireScreenShare: true,
            requireFullscreen: true,
            requireMonitorDisplaySurface: true,
            consentNoticeVersion: 'phase-1',
            dataRetentionDays: 180,
            dataDeletionSlaDays: 20,
            sensitiveDataDeletionTargetHours: 72,
            legalLinksJson: {},
          }}
          consentAccepted={false}
          loading={false}
          onAccept={onAccept}
        />
        <ProctoringPrecheckPanel
          consentAccepted={false}
          precheckPassed={false}
          bypassActive={false}
          loading={false}
          failureReasons={[]}
          onRunPrecheck={onRunPrecheck}
        />
      </>
    )

    await user.click(screen.getByRole('button', { name: /run precheck/i }))
    expect(onRunPrecheck).not.toHaveBeenCalled()

    await user.click(
      screen.getByRole('button', { name: /accept and continue/i })
    )
    expect(onAccept).toHaveBeenCalledTimes(1)

    rerender(
      <ProctoringPrecheckPanel
        consentAccepted
        precheckPassed={false}
        bypassActive={false}
        loading={false}
        failureReasons={[]}
        onRunPrecheck={onRunPrecheck}
      />
    )

    await user.click(screen.getByRole('button', { name: /run precheck/i }))
    expect(onRunPrecheck).toHaveBeenCalledTimes(1)
  })

  it('treats bypass as a valid start substitute without another bypass verification', () => {
    render(
      <ProctoringPrecheckPanel
        consentAccepted
        precheckPassed={false}
        bypassActive
        loading={false}
        failureReasons={['Camera permission denied']}
        onRunPrecheck={vi.fn()}
      />
    )

    expect(screen.getByText(/bypass approved/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /run precheck/i })).toBeDisabled()
  })
})
