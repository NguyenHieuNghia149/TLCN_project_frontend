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
    aiAdvisoryVisible: false,
    llmPrivacyApprovedAt: null,
    llmPrivacyApprovedBy: null,
    providerDpaReference: null,
    llmSummaryEnabled: false,
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

  it('renders configurable AI advisory and LLM summary controls', () => {
    render(
      <ProctoringSettingsPanel
        examId="exam-1"
        initialSettings={null}
        onSave={vi.fn()}
      />
    )

    expect(screen.getByText(/AI advisory visibility/i)).toBeInTheDocument()
    expect(screen.getByText(/LLM summary/i)).toBeInTheDocument()
    expect(
      screen.getByRole('switch', { name: /AI anomaly shadow mode/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('switch', { name: /AI advisory visibility/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('switch', { name: /LLM summary/i })
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

  it('allows enabling AI advisory visibility when shadow mode is off', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <ProctoringSettingsPanel
        examId="exam-1"
        initialSettings={makeSettings({
          aiShadowMode: true,
          aiAdvisoryVisible: false,
        })}
        onSave={onSave}
      />
    )

    await user.click(
      screen.getByRole('switch', { name: /AI anomaly shadow mode/i })
    )
    await user.click(
      screen.getByRole('switch', { name: /AI advisory visibility/i })
    )
    await user.click(
      screen.getByRole('button', { name: /save proctoring settings/i })
    )

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    const payload = onSave.mock.calls[0][0]
    expect(payload.aiShadowMode).toBe(false)
    expect(payload.aiAdvisoryVisible).toBe(true)
  })

  it('preserves aiAnomalyEnabled=false when saving existing settings', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <ProctoringSettingsPanel
        examId="exam-1"
        initialSettings={makeSettings({
          aiAnomalyEnabled: false,
        })}
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
    expect(payload.aiAnomalyEnabled).toBe(false)
  })

  it('requires privacy approval fields before enabling LLM summary', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <ProctoringSettingsPanel
        examId="exam-1"
        initialSettings={makeSettings()}
        onSave={onSave}
      />
    )

    await user.click(screen.getByRole('switch', { name: /LLM summary/i }))
    await user.click(
      screen.getByRole('button', { name: /save proctoring settings/i })
    )

    expect(onSave).not.toHaveBeenCalled()
    expect(
      screen.getByText(/privacy approval date is required/i)
    ).toBeInTheDocument()
  })

  it('sends LLM summary gate fields when enabled', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)

    render(
      <ProctoringSettingsPanel
        examId="exam-1"
        initialSettings={makeSettings()}
        onSave={onSave}
      />
    )

    await user.click(screen.getByRole('switch', { name: /LLM summary/i }))
    await user.type(
      screen.getByLabelText(/Privacy approval date/i),
      '2026-06-22T00:00:00.000Z'
    )
    await user.type(screen.getByLabelText(/Privacy approved by/i), 'teacher-1')
    await user.type(
      screen.getByLabelText(/Provider DPA reference/i),
      'dpa-ref-1'
    )
    await user.click(
      screen.getByRole('button', { name: /save proctoring settings/i })
    )

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    const payload = onSave.mock.calls[0][0]
    expect(payload.llmSummaryEnabled).toBe(true)
    expect(payload.llmPrivacyApprovedAt).toBe('2026-06-22T00:00:00.000Z')
    expect(payload.llmPrivacyApprovedBy).toBe('teacher-1')
    expect(payload.providerDpaReference).toBe('dpa-ref-1')
  })

  it('disables requirement controls when enabled is off', () => {
    render(
      <ProctoringSettingsPanel
        examId="exam-1"
        initialSettings={makeSettings({ enabled: false })}
        onSave={vi.fn()}
      />
    )

    expect(
      screen.getByRole('switch', { name: /Enable browser proctoring/i })
    ).not.toBeChecked()
    expect(
      screen.getByRole('switch', { name: /Require camera/i })
    ).toBeDisabled()
    expect(
      screen.getByRole('switch', { name: /Require fullscreen/i })
    ).toBeDisabled()
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

  it('shows backend error details instead of a generic axios status message', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockRejectedValue({
      message: 'Request failed with status code 404',
      response: {
        data: {
          message: 'Exam not found',
          code: 'EXAM_NOT_FOUND',
        },
      },
    })

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
      expect(screen.getByText(/exam not found/i)).toBeInTheDocument()
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
