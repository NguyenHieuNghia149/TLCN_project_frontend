import Button from '@/components/common/Button/Button'

type ProctoringPrecheckPanelProps = {
  consentAccepted: boolean
  precheckPassed: boolean
  bypassActive: boolean
  loading: boolean
  failureReasons: string[]
  onRunPrecheck: () => void
}

const ProctoringPrecheckPanel: React.FC<ProctoringPrecheckPanelProps> = ({
  consentAccepted,
  precheckPassed,
  bypassActive,
  loading,
  failureReasons,
  onRunPrecheck,
}) => {
  const blocked = !consentAccepted || precheckPassed || bypassActive

  return (
    <section
      className="mt-4 rounded-xl border p-5"
      style={{
        borderColor:
          precheckPassed || bypassActive
            ? 'var(--exam-success-subtle)'
            : 'var(--exam-card-border)',
        backgroundColor: 'var(--exam-card-bg)',
      }}
    >
      <h3
        className="text-lg font-semibold"
        style={{ color: 'var(--text-color)' }}
      >
        Device precheck
      </h3>
      <p className="mt-2 text-sm" style={{ color: 'var(--muted-text)' }}>
        Run the browser checks after consent. Permission prompts only appear
        when you start this precheck.
      </p>

      {precheckPassed ? (
        <p
          className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold"
          style={{
            backgroundColor: 'var(--exam-success-subtle)',
            color: 'var(--exam-success)',
          }}
        >
          Precheck passed
        </p>
      ) : null}

      {bypassActive ? (
        <p
          className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold"
          style={{
            backgroundColor: 'var(--exam-success-subtle)',
            color: 'var(--exam-success)',
          }}
        >
          Bypass approved
        </p>
      ) : null}

      {failureReasons.length ? (
        <ul
          className="mt-3 list-disc space-y-1 pl-5 text-sm"
          style={{ color: 'var(--exam-warning)' }}
        >
          {failureReasons.map(reason => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4">
        <Button
          onClick={onRunPrecheck}
          loading={loading}
          disabled={blocked}
          variant={blocked ? 'secondary' : 'primary'}
        >
          Run precheck
        </Button>
      </div>
    </section>
  )
}

export default ProctoringPrecheckPanel
