import { useCallback, useState } from 'react'
import Button from '@/components/common/Button/Button'

type PrecheckPhase = 'idle' | 'devices_checked' | 'fullscreen_entered'

type ProctoringPrecheckPanelProps = {
  consentAccepted: boolean
  precheckPassed: boolean
  bypassActive: boolean
  loading: boolean
  failureReasons: string[]
  requireFullscreen?: boolean
  onCheckDevices: () => Promise<unknown>
  onEnterFullscreen: () => Promise<boolean>
  onRunPrecheck: () => void
}

const ProctoringPrecheckPanel: React.FC<ProctoringPrecheckPanelProps> = ({
  consentAccepted,
  precheckPassed,
  bypassActive,
  loading,
  failureReasons,
  requireFullscreen = false,
  onCheckDevices,
  onEnterFullscreen,
  onRunPrecheck,
}) => {
  const [phase, setPhase] = useState<PrecheckPhase>('idle')

  const handleCheckDevices = useCallback(async () => {
    const result = await onCheckDevices()
    if (result) {
      if (requireFullscreen) {
        setPhase('devices_checked')
      } else {
        onRunPrecheck()
      }
    }
  }, [onCheckDevices, onRunPrecheck, requireFullscreen])

  const handleEnterFullscreen = useCallback(async () => {
    const ok = await onEnterFullscreen()
    if (ok) {
      setPhase('fullscreen_entered')
      onRunPrecheck()
    }
  }, [onEnterFullscreen, onRunPrecheck])

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
        when you start each step.
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

      {!blocked && phase === 'idle' ? (
        <>
          {requireFullscreen ? (
            <p className="mt-3 text-sm" style={{ color: 'var(--muted-text)' }}>
              This exam requires fullscreen. You will be asked to enter
              fullscreen after the device checks complete.
            </p>
          ) : null}
          <div className="mt-4">
            <Button
              onClick={() => void handleCheckDevices()}
              loading={loading}
              disabled={blocked}
              variant="primary"
            >
              Check devices
            </Button>
          </div>
        </>
      ) : null}

      {!blocked && phase === 'devices_checked' ? (
        <>
          <p
            className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold"
            style={{
              backgroundColor: 'var(--exam-success-subtle)',
              color: 'var(--exam-success)',
            }}
          >
            Device checks passed
          </p>
          <p className="mt-3 text-sm" style={{ color: 'var(--muted-text)' }}>
            Fullscreen is required for this proctored exam. Click below to enter
            fullscreen mode.
          </p>
          <div className="mt-4">
            <Button
              onClick={() => void handleEnterFullscreen()}
              loading={loading}
              variant="primary"
            >
              Enter fullscreen
            </Button>
          </div>
        </>
      ) : null}
    </section>
  )
}

export default ProctoringPrecheckPanel
