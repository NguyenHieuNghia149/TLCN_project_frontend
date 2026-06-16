// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ProctoringConsentPanel from '@/pages/exam/access/components/ProctoringConsentPanel'
import ProctoringPrecheckPanel from '@/pages/exam/access/components/ProctoringPrecheckPanel'

function makeNoopCheckDevices() {
  return vi.fn().mockResolvedValue({})
}

function makeNoopEnterFullscreen() {
  return vi.fn().mockResolvedValue(true)
}

describe('candidate proctoring access panels', () => {
  afterEach(() => {
    cleanup()
  })

  it('requires explicit consent before device check can run', async () => {
    const onAccept = vi.fn()
    const onCheckDevices = makeNoopCheckDevices()
    const onEnterFullscreen = makeNoopEnterFullscreen()
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
          requireFullscreen
          onCheckDevices={onCheckDevices}
          onEnterFullscreen={onEnterFullscreen}
          onRunPrecheck={onRunPrecheck}
        />
      </>
    )

    // Check devices button is not rendered when consent is not accepted
    expect(
      screen.queryByRole('button', { name: /check devices/i })
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /accept and continue/i })
    )
    expect(onAccept).toHaveBeenCalledTimes(1)

    rerender(
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
          consentAccepted
          loading={false}
          onAccept={onAccept}
        />
        <ProctoringPrecheckPanel
          consentAccepted
          precheckPassed={false}
          bypassActive={false}
          loading={false}
          failureReasons={[]}
          requireFullscreen
          onCheckDevices={onCheckDevices}
          onEnterFullscreen={onEnterFullscreen}
          onRunPrecheck={onRunPrecheck}
        />
      </>
    )

    await user.click(screen.getByRole('button', { name: /check devices/i }))
    expect(onCheckDevices).toHaveBeenCalledTimes(1)
  })

  it('treats bypass as a valid start substitute without another bypass verification', () => {
    render(
      <ProctoringPrecheckPanel
        consentAccepted
        precheckPassed={false}
        bypassActive
        loading={false}
        failureReasons={['Camera permission denied']}
        onCheckDevices={makeNoopCheckDevices()}
        onEnterFullscreen={makeNoopEnterFullscreen()}
        onRunPrecheck={vi.fn()}
      />
    )

    expect(screen.getByText(/bypass approved/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /check devices/i })
    ).not.toBeInTheDocument()
  })

  it('shows fullscreen phase note when requireFullscreen is true', () => {
    render(
      <ProctoringPrecheckPanel
        consentAccepted
        precheckPassed={false}
        bypassActive={false}
        loading={false}
        failureReasons={[]}
        requireFullscreen
        onCheckDevices={makeNoopCheckDevices()}
        onEnterFullscreen={makeNoopEnterFullscreen()}
        onRunPrecheck={vi.fn()}
      />
    )

    expect(
      screen.getByText(/enter fullscreen after the device checks complete/i)
    ).toBeInTheDocument()
  })

  it('shows Enter fullscreen button after device checks pass when requireFullscreen', async () => {
    const user = userEvent.setup()
    const onCheckDevices = vi.fn().mockResolvedValue({})
    const onEnterFullscreen = vi.fn().mockResolvedValue(true)
    const onRunPrecheck = vi.fn()

    render(
      <ProctoringPrecheckPanel
        consentAccepted
        precheckPassed={false}
        bypassActive={false}
        loading={false}
        failureReasons={[]}
        requireFullscreen
        onCheckDevices={onCheckDevices}
        onEnterFullscreen={onEnterFullscreen}
        onRunPrecheck={onRunPrecheck}
      />
    )

    await user.click(screen.getByRole('button', { name: /check devices/i }))

    const fullscreenBtn = await screen.findByRole('button', {
      name: /enter fullscreen/i,
    })
    expect(fullscreenBtn).toBeInTheDocument()

    await user.click(fullscreenBtn)
    expect(onEnterFullscreen).toHaveBeenCalledTimes(1)
    expect(onRunPrecheck).toHaveBeenCalledTimes(1)
  })

  it('calls onRunPrecheck directly when requireFullscreen is false after device check', async () => {
    const user = userEvent.setup()
    const onCheckDevices = vi.fn().mockResolvedValue({})
    const onEnterFullscreen = makeNoopEnterFullscreen()
    const onRunPrecheck = vi.fn()

    render(
      <ProctoringPrecheckPanel
        consentAccepted
        precheckPassed={false}
        bypassActive={false}
        loading={false}
        failureReasons={[]}
        requireFullscreen={false}
        onCheckDevices={onCheckDevices}
        onEnterFullscreen={onEnterFullscreen}
        onRunPrecheck={onRunPrecheck}
      />
    )

    await user.click(screen.getByRole('button', { name: /check devices/i }))
    expect(onRunPrecheck).toHaveBeenCalledTimes(1)
    expect(onEnterFullscreen).not.toHaveBeenCalled()
  })
})
