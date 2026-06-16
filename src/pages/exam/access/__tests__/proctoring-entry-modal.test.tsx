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

describe('ProctoringEntryModal', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders nothing when open is false', () => {
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

  it('renders modal with dialog role and title when open', () => {
    render(
      <ProctoringEntryModal
        open={true}
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

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText(/proctoring setup required/i)).toBeInTheDocument()
  })

  it('shows policy copy about metadata recording', () => {
    render(
      <ProctoringEntryModal
        open={true}
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

    expect(screen.getByText(/raw media/i)).toBeInTheDocument()
  })

  it('shows required capabilities from settings', () => {
    render(
      <ProctoringEntryModal
        open={true}
        settings={makeSettings({
          requireCamera: true,
          requireScreenShare: false,
          requireFullscreen: true,
        })}
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

    expect(screen.getByText(/camera availability check/i)).toBeInTheDocument()
    expect(screen.getByText(/fullscreen status/i)).toBeInTheDocument()
  })

  it('shows primary button Accept and continue', () => {
    render(
      <ProctoringEntryModal
        open={true}
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

    expect(
      screen.getByRole('button', { name: /accept and continue/i })
    ).toBeInTheDocument()
  })

  it('does not show bypass input initially', () => {
    render(
      <ProctoringEntryModal
        open={true}
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

    expect(
      screen.queryByPlaceholderText(/bypass code/i)
    ).not.toBeInTheDocument()
  })

  it('calls onAcceptAndSetup and onSetupComplete when setup succeeds', async () => {
    const user = userEvent.setup()
    const onAcceptAndSetup = vi.fn().mockResolvedValue(true)
    const onSetupComplete = vi.fn()

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
        onSetupComplete={onSetupComplete}
        onClose={vi.fn()}
      />
    )

    await user.click(
      screen.getByRole('button', { name: /accept and continue/i })
    )
    expect(onAcceptAndSetup).toHaveBeenCalledTimes(1)
    expect(onSetupComplete).toHaveBeenCalledTimes(1)
  })

  it('does not call onSetupComplete when setup fails', async () => {
    const user = userEvent.setup()
    const onAcceptAndSetup = vi.fn().mockResolvedValue(false)
    const onSetupComplete = vi.fn()

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
        onSetupComplete={onSetupComplete}
        onClose={vi.fn()}
      />
    )

    await user.click(
      screen.getByRole('button', { name: /accept and continue/i })
    )
    expect(onAcceptAndSetup).toHaveBeenCalledTimes(1)
    expect(onSetupComplete).not.toHaveBeenCalled()
  })

  it('shows loading state on primary button while loading', () => {
    render(
      <ProctoringEntryModal
        open={true}
        settings={makeSettings()}
        loading={true}
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

    expect(
      screen.queryByRole('button', { name: /accept and continue/i })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled()
  })

  it('shows failure reasons and bypass option when failureReasons is non-empty', () => {
    render(
      <ProctoringEntryModal
        open={true}
        settings={makeSettings()}
        loading={false}
        consentAccepted={true}
        precheckPassed={false}
        bypassActive={false}
        failureReasons={[
          'Camera permission denied',
          'Screen share unsupported',
        ]}
        onAcceptAndSetup={vi.fn()}
        onVerifyBypass={vi.fn()}
        onSetupComplete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/Camera permission denied/i)).toBeInTheDocument()
    expect(screen.getByText(/Screen share unsupported/i)).toBeInTheDocument()
    expect(screen.getByText(/I have a bypass code/i)).toBeInTheDocument()
  })

  it('shows bypass input after clicking I have a bypass code', async () => {
    const user = userEvent.setup()

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

    expect(
      screen.queryByPlaceholderText(/bypass code/i)
    ).not.toBeInTheDocument()

    await user.click(screen.getByText(/I have a bypass code/i))

    expect(screen.getByPlaceholderText(/bypass code/i)).toBeInTheDocument()
  })

  it('calls onVerifyBypass with code when Verify bypass is clicked', async () => {
    const user = userEvent.setup()
    const onVerifyBypass = vi.fn().mockResolvedValue({})

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
        onVerifyBypass={onVerifyBypass}
        onSetupComplete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    await user.click(screen.getByText(/I have a bypass code/i))

    const input = screen.getByPlaceholderText(/bypass code/i)
    await user.type(input, 'BP-CODE-123')

    await user.click(screen.getByRole('button', { name: /verify bypass/i }))

    expect(onVerifyBypass).toHaveBeenCalledWith('BP-CODE-123')
  })

  it('shows Bypass approved when bypassActive is true', () => {
    render(
      <ProctoringEntryModal
        open={true}
        settings={makeSettings()}
        loading={false}
        consentAccepted={true}
        precheckPassed={false}
        bypassActive={true}
        failureReasons={[]}
        onAcceptAndSetup={vi.fn()}
        onVerifyBypass={vi.fn()}
        onSetupComplete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/bypass approved/i)).toBeInTheDocument()
  })

  it('shows error message when error prop is provided', () => {
    render(
      <ProctoringEntryModal
        open={true}
        settings={makeSettings()}
        loading={false}
        error="Setup failed. Please try again."
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

    expect(
      screen.getByText(/Setup failed. Please try again./i)
    ).toBeInTheDocument()
  })

  it('shows consent accepted state when consentAccepted is true and loading', () => {
    render(
      <ProctoringEntryModal
        open={true}
        settings={makeSettings()}
        loading={true}
        consentAccepted={true}
        precheckPassed={false}
        bypassActive={false}
        failureReasons={[]}
        onAcceptAndSetup={vi.fn()}
        onVerifyBypass={vi.fn()}
        onSetupComplete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText(/precheck in progress/i)).toBeInTheDocument()
  })

  it('shows retry setup button when consentAccepted is true and not loading', () => {
    render(
      <ProctoringEntryModal
        open={true}
        settings={makeSettings()}
        loading={false}
        consentAccepted={true}
        precheckPassed={false}
        bypassActive={false}
        failureReasons={[]}
        onAcceptAndSetup={vi.fn()}
        onVerifyBypass={vi.fn()}
        onSetupComplete={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getByRole('button', { name: /retry setup/i })
    ).toBeInTheDocument()
  })
})
