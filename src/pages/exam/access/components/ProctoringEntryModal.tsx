import { useState } from 'react'

import Button from '@/components/common/Button/Button'
import type { ProctoringSettings } from '@/types/exam.types'

type ProctoringEntryModalProps = {
  open: boolean
  settings: ProctoringSettings
  loading: boolean
  error?: string | null
  consentAccepted: boolean
  precheckPassed: boolean
  bypassActive: boolean
  failureReasons: string[]
  onAcceptAndSetup: () => Promise<boolean>
  onVerifyBypass: (code: string) => Promise<unknown>
  onSetupComplete: () => void
  onClose: () => void
}

const ProctoringEntryModal: React.FC<ProctoringEntryModalProps> = ({
  open,
  settings,
  loading,
  error,
  consentAccepted,
  precheckPassed,
  bypassActive,
  failureReasons,
  onAcceptAndSetup,
  onVerifyBypass,
  onSetupComplete,
  onClose,
}) => {
  const [showBypass, setShowBypass] = useState(false)
  const [bypassCode, setBypassCode] = useState('')

  if (!open) return null

  const requiredCapabilities = [
    settings.requireCamera ? 'camera availability check' : null,
    settings.requireFullscreen ? 'fullscreen status' : null,
  ].filter(Boolean)

  const setupComplete = precheckPassed || bypassActive

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Proctoring setup required"
    >
      <div
        className="w-full max-w-lg rounded-xl border p-6"
        style={{
          backgroundColor: 'var(--exam-card-bg)',
          borderColor: setupComplete
            ? 'var(--exam-success-subtle)'
            : 'var(--exam-card-border)',
          color: 'var(--text-color)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        <h2
          className="text-xl font-semibold"
          style={{ color: 'var(--text-color)' }}
        >
          Proctoring setup required
        </h2>

        <p className="mt-3 text-sm" style={{ color: 'var(--muted-text)' }}>
          This proctored exam records browser-level metadata for review. It does
          not send raw media, pasted text, keystrokes, or source code.
          Permission prompts appear only when you click the setup button.
        </p>

        {requiredCapabilities.length ? (
          <ul
            className="mt-3 list-disc space-y-1 pl-5 text-sm"
            style={{ color: 'var(--muted-text)' }}
          >
            {requiredCapabilities.map(capability => (
              <li key={capability}>{capability}</li>
            ))}
          </ul>
        ) : null}

        <p className="mt-3 text-xs" style={{ color: 'var(--muted-text)' }}>
          Notice version {settings.consentNoticeVersion}. Retention:{' '}
          {settings.dataRetentionDays} days.
        </p>

        {error ? (
          <p
            className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold"
            style={{
              backgroundColor: 'var(--exam-danger-subtle)',
              color: 'var(--exam-danger)',
            }}
          >
            {error}
          </p>
        ) : null}

        {setupComplete ? (
          <p
            className="mt-4 rounded-lg px-3 py-2 text-sm font-semibold"
            style={{
              backgroundColor: 'var(--exam-success-subtle)',
              color: 'var(--exam-success)',
            }}
          >
            Setup complete
          </p>
        ) : null}

        {consentAccepted && !setupComplete && loading ? (
          <p className="mt-3 text-sm" style={{ color: 'var(--muted-text)' }}>
            Precheck in progress. Follow the browser permission prompts to
            complete device setup.
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

        {failureReasons.length && !bypassActive ? (
          <ul
            className="mt-3 list-disc space-y-1 pl-5 text-sm"
            style={{ color: 'var(--exam-warning)' }}
          >
            {failureReasons.map(reason => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}

        {(failureReasons.length || (consentAccepted && error)) &&
        !bypassActive &&
        !showBypass ? (
          <button
            type="button"
            className="mt-3 cursor-pointer text-sm underline"
            style={{
              color: 'var(--exam-accent)',
              background: 'none',
              border: 'none',
            }}
            onClick={() => setShowBypass(true)}
          >
            I have a bypass code
          </button>
        ) : null}

        {showBypass && !bypassActive ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm" style={{ color: 'var(--muted-text)' }}>
              Use an organizer-issued bypass code only if camera or fullscreen
              setup cannot pass.
            </p>
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={event => {
                event.preventDefault()
                if (bypassCode.trim()) {
                  void onVerifyBypass(bypassCode.trim())
                }
              }}
            >
              <input
                className="min-w-0 flex-1 rounded-xl border px-4 py-3"
                style={{
                  borderColor: 'var(--exam-card-border)',
                  backgroundColor: 'var(--background-color)',
                  color: 'var(--text-color)',
                }}
                value={bypassCode}
                onChange={event => setBypassCode(event.target.value)}
                placeholder="Enter bypass code"
                autoComplete="one-time-code"
              />
              <Button
                type="submit"
                loading={loading}
                disabled={!bypassCode.trim()}
              >
                Verify bypass
              </Button>
            </form>
          </div>
        ) : null}

        {!setupComplete && !consentAccepted ? (
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const ok = await onAcceptAndSetup()
                if (ok) {
                  onSetupComplete()
                }
              }}
              loading={loading}
              disabled={loading}
            >
              Accept and continue
            </Button>
          </div>
        ) : null}

        {consentAccepted && !setupComplete ? (
          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const ok = await onAcceptAndSetup()
                if (ok) {
                  onSetupComplete()
                }
              }}
              loading={loading}
              disabled={loading}
            >
              Retry setup
            </Button>
          </div>
        ) : null}

        {setupComplete ? (
          <div className="mt-5 flex justify-end">
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default ProctoringEntryModal
