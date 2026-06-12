import Button from '@/components/common/Button/Button'

type ConsentSettings = {
  enabled: boolean
  requireCamera: boolean
  requireScreenShare: boolean
  requireFullscreen: boolean
  requireMonitorDisplaySurface: boolean
  consentNoticeVersion: string
  dataRetentionDays: number
  dataDeletionSlaDays: number
  sensitiveDataDeletionTargetHours: number
  legalLinksJson: Record<string, string>
}

type ProctoringConsentPanelProps = {
  settings: ConsentSettings
  consentAccepted: boolean
  loading: boolean
  onAccept: () => void
}

const ProctoringConsentPanel: React.FC<ProctoringConsentPanelProps> = ({
  settings,
  consentAccepted,
  loading,
  onAccept,
}) => {
  if (!settings.enabled) {
    return null
  }

  const requiredCapabilities = [
    settings.requireCamera ? 'camera availability check' : null,
    settings.requireScreenShare ? 'screen share availability check' : null,
    settings.requireFullscreen ? 'fullscreen status' : null,
    settings.requireMonitorDisplaySurface ? 'monitor display surface' : null,
  ].filter(Boolean)

  return (
    <section
      className="mt-4 rounded-xl border p-5"
      style={{
        borderColor: consentAccepted
          ? 'var(--exam-success-subtle)'
          : 'var(--exam-card-border)',
        backgroundColor: 'var(--exam-card-bg)',
      }}
    >
      <div className="space-y-2">
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--text-color)' }}
        >
          Proctoring consent
        </h3>
        <p className="text-sm" style={{ color: 'var(--muted-text)' }}>
          This proctored exam records browser-level metadata for review. It does
          not send raw media, pasted text, keystrokes, or source code.
        </p>
        {requiredCapabilities.length ? (
          <ul
            className="list-disc space-y-1 pl-5 text-sm"
            style={{ color: 'var(--muted-text)' }}
          >
            {requiredCapabilities.map(capability => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
        ) : null}
        <p className="text-xs" style={{ color: 'var(--muted-text)' }}>
          Notice version {settings.consentNoticeVersion}. Retention:{' '}
          {settings.dataRetentionDays} days. Data requests SLA:{' '}
          {settings.dataDeletionSlaDays} days. Sensitive-data target:{' '}
          {settings.sensitiveDataDeletionTargetHours} hours.
        </p>
      </div>

      <div className="mt-4">
        {consentAccepted ? (
          <span
            className="rounded-full px-3 py-1 text-sm font-semibold"
            style={{
              backgroundColor: 'var(--exam-success-subtle)',
              color: 'var(--exam-success)',
            }}
          >
            Consent accepted
          </span>
        ) : (
          <Button onClick={onAccept} loading={loading}>
            Accept and continue
          </Button>
        )}
      </div>
    </section>
  )
}

export default ProctoringConsentPanel
