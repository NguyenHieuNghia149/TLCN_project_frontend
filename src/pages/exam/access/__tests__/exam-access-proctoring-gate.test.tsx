// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ProctoringEntryModal from '@/pages/exam/access/components/ProctoringEntryModal'
import type { ProctoringSettings } from '@/types/exam.types'

function makeSettings(overrides: Partial<ProctoringSettings> = {}) {
  return {
    examId: 'exam-1',
    enabled: true,
    requireCamera: true,
    requireScreenShare: true,
    requireFullscreen: true,
    requireMonitorDisplaySurface: false,
    precheckValiditySeconds: 300,
    heartbeatIntervalSeconds: 60,
    missedHeartbeatGraceMultiplier: 3,
    screenShareResumeTimeoutSeconds: 30,
    fullscreenResumeTimeoutSeconds: 15,
    allowedEventTypesJson: ['heartbeat'],
    riskWeightsJson: {},
    riskThresholdsJson: {},
    clipboardPolicy: 'log_only' as const,
    aiAnomalyEnabled: true,
    aiShadowMode: true,
    aiJobWindowSeconds: 300,
    consentNoticeVersion: 'phase-1',
    legalLinksJson: {},
    dataRetentionDays: 180,
    dataDeletionSlaDays: 20,
    sensitiveDataDeletionTargetHours: 72,
    ...overrides,
  }
}

describe('exam-access-proctoring-gate', () => {
  afterEach(() => {
    cleanup()
  })

  it('modal opens when proctoring is enabled and start is not ready', () => {
    const onAcceptAndSetup = vi.fn().mockResolvedValue(true)

    render(
      <ProctoringEntryModal
        open={true}
        settings={makeSettings()}
        loading={false}
        consentAccepted={false}
        precheckPassed={false}
        bypassActive={false}
        failureReasons={[]}
        onAcceptAndSetup={onAcceptAndSetup}
        onVerifyBypass={vi.fn()}
        onSetupComplete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getByRole('dialog', { name: /proctoring setup required/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /accept and continue/i })
    ).toBeInTheDocument()
  })

  it('modal shows setup complete state when precheck passes', () => {
    render(
      <ProctoringEntryModal
        open={true}
        settings={makeSettings()}
        loading={false}
        consentAccepted={true}
        precheckPassed={true}
        bypassActive={false}
        failureReasons={[]}
        onAcceptAndSetup={vi.fn()}
        onVerifyBypass={vi.fn()}
        onSetupComplete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/setup complete/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /accept and continue/i })
    ).not.toBeInTheDocument()
  })

  it('bypass option only appears after precheck failure', () => {
    render(
      <ProctoringEntryModal
        open={true}
        settings={makeSettings()}
        loading={false}
        consentAccepted={true}
        precheckPassed={false}
        bypassActive={false}
        failureReasons={['Camera permission denied']}
        onAcceptAndSetup={vi.fn()}
        onVerifyBypass={vi.fn()}
        onSetupComplete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/I have a bypass code/i)).toBeInTheDocument()
  })

  it('onAcceptAndSetup is called when user accepts from modal', async () => {
    const user = userEvent.setup()
    const onAcceptAndSetup = vi.fn().mockResolvedValue(true)

    render(
      <ProctoringEntryModal
        open={true}
        settings={makeSettings()}
        loading={false}
        consentAccepted={false}
        precheckPassed={false}
        bypassActive={false}
        failureReasons={[]}
        onAcceptAndSetup={onAcceptAndSetup}
        onVerifyBypass={vi.fn()}
        onSetupComplete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    await user.click(
      screen.getByRole('button', { name: /accept and continue/i })
    )
    expect(onAcceptAndSetup).toHaveBeenCalledTimes(1)
  })

  it('modal is hidden when open is false', () => {
    const { container } = render(
      <ProctoringEntryModal
        open={false}
        settings={makeSettings()}
        loading={false}
        consentAccepted={false}
        precheckPassed={false}
        bypassActive={false}
        failureReasons={[]}
        onAcceptAndSetup={vi.fn()}
        onVerifyBypass={vi.fn()}
        onSetupComplete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(container.innerHTML).toBe('')
  })
})
