import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Divider,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd'
import type {
  AdminUpdateProctoringSettingsPayload,
  ProctoringSettings,
} from '@/types/exam.types'

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
  const [requireScreenShare, setRequireScreenShare] = useState(
    initialSettings?.requireScreenShare ?? true
  )
  const [requireFullscreen, setRequireFullscreen] = useState(
    initialSettings?.requireFullscreen ?? true
  )
  const [requireMonitorDisplaySurface, setRequireMonitorDisplaySurface] =
    useState(initialSettings?.requireMonitorDisplaySurface ?? true)
  const [clipboardPolicy, setClipboardPolicy] = useState<
    'log_only' | 'block' | 'ignore'
  >(
    (initialSettings?.clipboardPolicy as 'log_only' | 'block' | 'ignore') ??
      'log_only'
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialSettings) {
      setEnabled(initialSettings.enabled)
      setRequireCamera(initialSettings.requireCamera)
      setRequireScreenShare(initialSettings.requireScreenShare)
      setRequireFullscreen(initialSettings.requireFullscreen)
      setRequireMonitorDisplaySurface(
        initialSettings.requireMonitorDisplaySurface
      )
      setClipboardPolicy(
        (initialSettings.clipboardPolicy as 'log_only' | 'block' | 'ignore') ??
          'log_only'
      )
    }
  }, [initialSettings])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave({
        enabled,
        requireCamera,
        requireScreenShare,
        requireFullscreen,
        requireMonitorDisplaySurface,
        clipboardPolicy,
        aiAnomalyEnabled: true,
        aiShadowMode: true,
        aiAdvisoryVisible: false,
        llmSummaryEnabled: false,
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save proctoring settings'
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
          <Text strong>Require screen share</Text>
          <Switch
            checked={requireScreenShare}
            onChange={setRequireScreenShare}
            disabled={!enabled || loading || saving}
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
          <Text strong>Require monitor display surface</Text>
          <Switch
            checked={requireMonitorDisplaySurface}
            onChange={setRequireMonitorDisplaySurface}
            disabled={!enabled || loading || saving}
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
              <Text type="secondary">ON</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              AI anomaly signals are processed in shadow mode (visible only to
              platform operators).
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
              <Text type="warning">Locked until pilot gate passes</Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              AI advisory becomes visible to reviewers only after the pilot
              evaluation gate is satisfied.
            </Text>

            <Divider style={{ margin: '4px 0' }} />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text strong>LLM summary</Text>
              <Text type="danger">
                Disabled until privacy/runtime gate passes
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              LLM-generated review summaries are disabled until the privacy and
              runtime gate is approved.
            </Text>
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
