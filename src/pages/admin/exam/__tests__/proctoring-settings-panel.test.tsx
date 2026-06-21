// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import React from 'react'

import ProctoringSettingsPanel from '@/pages/admin/exam/components/ProctoringSettingsPanel'
import type { ProctoringSettings } from '@/types/exam.types'

function makeSettings(
  overrides: Partial<ProctoringSettings> = {}
): ProctoringSettings {
  return {
    examId: 'exam-1',
    enabled: false,
    requireCamera: true,
    requireScreenShare: true,
    requireFullscreen: true,
    requireMonitorDisplaySurface: true,
    precheckValiditySeconds: 300,
    heartbeatIntervalSeconds: 10,
    missedHeartbeatGraceMultiplier: 3,
    screenShareResumeTimeoutSeconds: 30,
    fullscreenResumeTimeoutSeconds: 30,
    allowedEventTypesJson: [],
    riskWeightsJson: {},
    riskThresholdsJson: {},
    clipboardPolicy: 'log_only',
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

describe('ProctoringSettingsPanel', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders locked AI advisory and LLM summary', () => {
    render(
      <ProctoringSettingsPanel
        examId="exam-1"
        initialSettings={null}
        onSave={vi.fn()}
      />
    )

    expect(
      screen.getByText(/locked until pilot gate passes/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/disabled until privacy\/runtime gate passes/i)
    ).toBeInTheDocument()
  })

  it('toggles enabled and saves with correct payload', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <ProctoringSettingsPanel
        examId="exam-1"
        initialSettings={makeSettings({ enabled: false })}
        onSave={onSave}
      />
    )

    const enableSwitch = screen.getAllByRole('switch')[0]
    expect(enableSwitch).not.toBeChecked()

    await user.click(enableSwitch)
    expect(enableSwitch).toBeChecked()

    await user.click(
      screen.getByRole('button', { name: /save proctoring settings/i })
    )

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    const payload = onSave.mock.calls[0][0]
    expect(payload.enabled).toBe(true)
    expect(payload.aiAnomalyEnabled).toBe(true)
    expect(payload.aiShadowMode).toBe(true)
    expect(payload.aiAdvisoryVisible).toBe(false)
    expect(payload.llmSummaryEnabled).toBe(false)
  })

  it('never sends aiAdvisoryVisible=true or llmSummaryEnabled=true', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <ProctoringSettingsPanel
        examId="exam-1"
        initialSettings={makeSettings()}
        onSave={onSave}
      />
    )

    await user.click(
      screen.getByRole('button', { name: /save proctoring settings/i })
    )

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    const payload = onSave.mock.calls[0][0]
    // The panel hardcodes these to false and never exposes UI to change them
    expect(payload.aiAdvisoryVisible).toBe(false)
    expect(payload.llmSummaryEnabled).toBe(false)
  })

  it('disables requirement controls when enabled is off', () => {
    render(
      <ProctoringSettingsPanel
        examId="exam-1"
        initialSettings={makeSettings({ enabled: false })}
        onSave={vi.fn()}
      />
    )

    const switches = screen.getAllByRole('switch')
    // First switch is the main "Enable browser proctoring" toggle
    expect(switches[0]).not.toBeChecked()
    // Remaining switches should be disabled when enabled is off
    for (let i = 1; i < switches.length; i++) {
      expect(switches[i]).toBeDisabled()
    }
  })

  it('shows error message on save failure', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue(new Error('Network error'))

    render(
      <ProctoringSettingsPanel
        examId="exam-1"
        initialSettings={makeSettings()}
        onSave={onSave}
      />
    )

    await user.click(
      screen.getByRole('button', { name: /save proctoring settings/i })
    )

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })

  it('syncs state when initialSettings changes', () => {
    const settings1 = makeSettings({ enabled: false, requireFullscreen: false })
    const settings2 = makeSettings({ enabled: true, requireFullscreen: true })

    const { rerender } = render(
      <ProctoringSettingsPanel
        examId="exam-1"
        initialSettings={settings1}
        onSave={vi.fn()}
      />
    )

    const mainSwitch = screen.getAllByRole('switch')[0]
    expect(mainSwitch).not.toBeChecked()

    rerender(
      <ProctoringSettingsPanel
        examId="exam-1"
        initialSettings={settings2}
        onSave={vi.fn()}
      />
    )

    expect(mainSwitch).toBeChecked()
  })
})
