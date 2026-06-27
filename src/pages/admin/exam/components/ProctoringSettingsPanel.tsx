import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Divider,
  Input,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd'
import type {
  AdminUpdateProctoringSettingsPayload,
  ProctoringSettings,
} from '@/types/exam.types'
import { extractApiErrorMessage } from '@/utils/apiError'

const { Text } = Typography

type ProctoringSettingsPanelProps = {
  examId: string
  initialSettings?: ProctoringSettings | null
  loading?: boolean
  onSave: (payload: AdminUpdateProctoringSettingsPayload) => Promise<void>
}

const CLIPBOARD_OPTIONS = [
  { value: 'log_only', label: 'Log only' },
  { value: 'block', label: 'Block' },
  { value: 'ignore', label: 'Ignore' },
]

const ProctoringSettingsPanel: React.FC<ProctoringSettingsPanelProps> = ({
  initialSettings,
  loading = false,
  onSave,
}) => {
  const [enabled, setEnabled] = useState(initialSettings?.enabled ?? false)
  const [requireCamera, setRequireCamera] = useState(
    initialSettings?.requireCamera ?? true
  )
  const [requireFullscreen, setRequireFullscreen] = useState(
    initialSettings?.requireFullscreen ?? true
  )
  const [clipboardPolicy, setClipboardPolicy] = useState<
    'log_only' | 'block' | 'ignore'
  >(
    (initialSettings?.clipboardPolicy as 'log_only' | 'block' | 'ignore') ??
      'log_only'
  )
  const [aiShadowMode, setAiShadowMode] = useState(
    initialSettings?.aiShadowMode ?? true
  )
  const [aiAnomalyEnabled, setAiAnomalyEnabled] = useState(
    initialSettings?.aiAnomalyEnabled ?? true
  )
  const [aiAdvisoryVisible, setAiAdvisoryVisible] = useState(
    initialSettings?.aiAdvisoryVisible ?? false
  )
  const [llmSummaryEnabled, setLlmSummaryEnabled] = useState(
    initialSettings?.llmSummaryEnabled ?? false
  )
  const [llmPrivacyApprovedAt, setLlmPrivacyApprovedAt] = useState(
    initialSettings?.llmPrivacyApprovedAt ?? ''
  )
  const [llmPrivacyApprovedBy, setLlmPrivacyApprovedBy] = useState(
    initialSettings?.llmPrivacyApprovedBy ?? ''
  )
  const [providerDpaReference, setProviderDpaReference] = useState(
    initialSettings?.providerDpaReference ?? ''
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialSettings) {
      setEnabled(initialSettings.enabled)
      setRequireCamera(initialSettings.requireCamera)
      setRequireFullscreen(initialSettings.requireFullscreen)
      setClipboardPolicy(
        (initialSettings.clipboardPolicy as 'log_only' | 'block' | 'ignore') ??
          'log_only'
      )
      setAiAnomalyEnabled(initialSettings.aiAnomalyEnabled ?? true)
      setAiShadowMode(initialSettings.aiShadowMode ?? true)
      setAiAdvisoryVisible(initialSettings.aiAdvisoryVisible ?? false)
      setLlmSummaryEnabled(initialSettings.llmSummaryEnabled ?? false)
      setLlmPrivacyApprovedAt(initialSettings.llmPrivacyApprovedAt ?? '')
      setLlmPrivacyApprovedBy(initialSettings.llmPrivacyApprovedBy ?? '')
      setProviderDpaReference(initialSettings.providerDpaReference ?? '')
    }
  }, [initialSettings])

  const handleSave = async () => {
    if (llmSummaryEnabled && !llmPrivacyApprovedAt.trim()) {
      setError('Privacy approval date is required before enabling LLM summary.')
      return
    }
    if (llmSummaryEnabled && !llmPrivacyApprovedBy.trim()) {
      setError('Privacy approver is required before enabling LLM summary.')
      return
    }
    if (llmSummaryEnabled && !providerDpaReference.trim()) {
      setError(
        'Provider DPA reference is required before enabling LLM summary.'
      )
      return
    }

    setSaving(true)
    setError(null)
    try {
      await onSave({
        enabled,
        requireCamera,
        requireScreenShare: false,
        requireFullscreen,
        requireMonitorDisplaySurface: false,
        clipboardPolicy,
        aiAnomalyEnabled,
        aiShadowMode,
        aiAdvisoryVisible: aiShadowMode ? false : aiAdvisoryVisible,
        llmSummaryEnabled,
        llmPrivacyApprovedAt: llmSummaryEnabled
          ? llmPrivacyApprovedAt.trim()
          : null,
        llmPrivacyApprovedBy: llmSummaryEnabled
          ? llmPrivacyApprovedBy.trim()
          : null,
        providerDpaReference: llmSummaryEnabled
          ? providerDpaReference.trim()
          : null,
      })
    } catch (err) {
      setError(
        extractApiErrorMessage(err, 'Failed to save proctoring settings')
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Proctoring settings" size="small">
      {error ? (
        <Alert
          type="error"
          message={error}
          closable
          onClose={() => setError(null)}
          className="mb-4"
        />
      ) : null}

      <Space direction="vertical" size="middle" className="w-full">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Text strong>Enable browser proctoring</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Controls consent, precheck, telemetry, and enforcement for this
              exam.
            </Text>
          </div>
          <Switch
            checked={enabled}
            onChange={setEnabled}
            disabled={loading || saving}
            aria-label="Enable browser proctoring"
          />
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: enabled ? 1 : 0.45,
          }}
        >
          <Text strong>Require camera</Text>
          <Switch
            checked={requireCamera}
            onChange={setRequireCamera}
            disabled={!enabled || loading || saving}
            aria-label="Require camera"
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: enabled ? 1 : 0.45,
          }}
        >
          <Text strong>Require fullscreen</Text>
          <Switch
            checked={requireFullscreen}
            onChange={setRequireFullscreen}
            disabled={!enabled || loading || saving}
            aria-label="Require fullscreen"
          />
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: enabled ? 1 : 0.45,
          }}
        >
          <Text strong>Clipboard policy</Text>
          <Select
            value={clipboardPolicy}
            onChange={setClipboardPolicy}
            options={CLIPBOARD_OPTIONS}
            disabled={!enabled || loading || saving}
            style={{ width: 160 }}
          />
        </div>

        <Divider style={{ margin: '8px 0' }} />

        <Card size="small" style={{ backgroundColor: '#fafafa' }}>
          <Space direction="vertical" size="small" className="w-full">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text strong>AI anomaly shadow mode</Text>
              <Switch
                checked={aiShadowMode}
                onChange={checked => {
                  setAiShadowMode(checked)
                  if (checked) {
                    setAiAdvisoryVisible(false)
                  }
                }}
                disabled={loading || saving}
                aria-label="AI anomaly shadow mode"
              />
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Keep this on to process anomaly signals without showing them to
              reviewers. Turn it off before enabling reviewer-visible advisory.
            </Text>

            <Divider style={{ margin: '4px 0' }} />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text strong>AI advisory visibility</Text>
              <Switch
                checked={aiAdvisoryVisible}
                onChange={setAiAdvisoryVisible}
                disabled={aiShadowMode || loading || saving}
                aria-label="AI advisory visibility"
              />
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Reviewer-visible anomaly advisory. Backend will still reject save
              if the pilot evaluation gate has not passed.
            </Text>
            {aiShadowMode ? (
              <Text type="warning" style={{ fontSize: 12 }}>
                Turn off shadow mode to enable advisory visibility.
              </Text>
            ) : null}

            <Divider style={{ margin: '4px 0' }} />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text strong>LLM summary</Text>
              <Switch
                checked={llmSummaryEnabled}
                onChange={setLlmSummaryEnabled}
                disabled={loading || saving}
                aria-label="LLM summary"
              />
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Enable assistive review summaries. Privacy approval and provider
              DPA metadata are required before save.
            </Text>
            <label className="grid gap-1">
              <Text style={{ fontSize: 12 }}>Privacy approval date</Text>
              <Input
                value={llmPrivacyApprovedAt}
                onChange={event => setLlmPrivacyApprovedAt(event.target.value)}
                placeholder="2026-06-22T00:00:00.000Z"
                disabled={!llmSummaryEnabled || loading || saving}
                aria-label="Privacy approval date"
              />
            </label>
            <label className="grid gap-1">
              <Text style={{ fontSize: 12 }}>Privacy approved by</Text>
              <Input
                value={llmPrivacyApprovedBy}
                onChange={event => setLlmPrivacyApprovedBy(event.target.value)}
                placeholder="teacher-1"
                disabled={!llmSummaryEnabled || loading || saving}
                aria-label="Privacy approved by"
              />
            </label>
            <label className="grid gap-1">
              <Text style={{ fontSize: 12 }}>Provider DPA reference</Text>
              <Input
                value={providerDpaReference}
                onChange={event => setProviderDpaReference(event.target.value)}
                placeholder="dpa-ref-1"
                disabled={!llmSummaryEnabled || loading || saving}
                aria-label="Provider DPA reference"
              />
            </label>
          </Space>
        </Card>
      </Space>

      <Divider style={{ margin: '16px 0 8px' }} />

      <Button
        type="primary"
        onClick={handleSave}
        loading={saving}
        disabled={loading}
        block
      >
        Save proctoring settings
      </Button>
    </Card>
  )
}

export default ProctoringSettingsPanel
