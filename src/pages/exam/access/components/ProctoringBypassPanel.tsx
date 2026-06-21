import { useState } from 'react'

import Button from '@/components/common/Button/Button'

type ProctoringBypassPanelProps = {
  consentAccepted: boolean
  precheckPassed: boolean
  bypassActive: boolean
  loading: boolean
  onVerify: (code: string) => Promise<unknown> | unknown
}

const ProctoringBypassPanel: React.FC<ProctoringBypassPanelProps> = ({
  consentAccepted,
  precheckPassed,
  bypassActive,
  loading,
  onVerify,
}) => {
  const [code, setCode] = useState('')

  if (!consentAccepted || precheckPassed || bypassActive) {
    return null
  }

  return (
    <section
      className="mt-4 rounded-xl border p-5"
      style={{
        borderColor: 'var(--exam-card-border)',
        backgroundColor: 'var(--exam-card-bg)',
      }}
    >
      <h3
        className="text-lg font-semibold"
        style={{ color: 'var(--text-color)' }}
      >
        Bypass code
      </h3>
      <p className="mt-2 text-sm" style={{ color: 'var(--muted-text)' }}>
        Use an organizer-issued code only if device precheck cannot pass.
      </p>
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row"
        onSubmit={event => {
          event.preventDefault()
          if (code.trim()) {
            void onVerify(code.trim())
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
          value={code}
          onChange={event => setCode(event.target.value)}
          placeholder="Enter bypass code"
          autoComplete="one-time-code"
        />
        <Button type="submit" loading={loading} disabled={!code.trim()}>
          Verify bypass
        </Button>
      </form>
    </section>
  )
}

export default ProctoringBypassPanel
