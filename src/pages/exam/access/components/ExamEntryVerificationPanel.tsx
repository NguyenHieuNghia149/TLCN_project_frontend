import React from 'react'
import Button from '@/components/common/Button/Button'

type ExamEntryVerificationPanelProps = {
  requiresLogin: boolean
  isAuthenticated: boolean
  requiresOtp: boolean
  otpEmail: string
  otpCode: string
  otpCooldown: number
  actionLoading: boolean
  onSignIn: () => void
  onSendOtp: () => void
  onOtpEmailChange: (value: string) => void
  onOtpCodeChange: (value: string) => void
  onVerifyOtp: (event: React.FormEvent) => void
}

const inputStyle: React.CSSProperties = {
  borderColor: 'var(--exam-card-border)',
  backgroundColor: 'var(--background-color)',
  color: 'var(--text-color)',
}

const ExamEntryVerificationPanel: React.FC<ExamEntryVerificationPanelProps> = ({
  requiresLogin,
  isAuthenticated,
  requiresOtp,
  otpEmail,
  otpCode,
  otpCooldown,
  actionLoading,
  onSignIn,
  onSendOtp,
  onOtpEmailChange,
  onOtpCodeChange,
  onVerifyOtp,
}) => {
  return (
    <div className="mt-4 space-y-4">
      {requiresLogin && !isAuthenticated ? (
        <div
          className="rounded-xl border p-4"
          style={{
            borderColor: 'var(--exam-card-border)',
            backgroundColor: 'var(--exam-card-bg)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--muted-text)' }}>
            Sign in with the account linked to this exam access.
          </p>
          <div className="mt-4">
            <Button onClick={onSignIn} variant="primary">
              Sign in to continue
            </Button>
          </div>
        </div>
      ) : null}

      {requiresOtp ? (
        <div
          className="space-y-4 rounded-xl border p-4"
          style={{
            borderColor: 'var(--exam-card-border)',
            backgroundColor: 'var(--exam-card-bg)',
          }}
        >
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--text-color)' }}
          >
            Verify your identity
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-text)' }}>
            We will send a one-time password to your email.
          </p>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              className="rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              style={inputStyle}
              type="email"
              value={otpEmail}
              onChange={event => onOtpEmailChange(event.target.value)}
              placeholder="candidate@example.com"
            />
            <Button
              onClick={onSendOtp}
              disabled={otpCooldown > 0}
              loading={actionLoading}
              variant="outline"
            >
              {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Send OTP'}
            </Button>
          </div>
          <form
            className="grid gap-3 md:grid-cols-[1fr_auto]"
            onSubmit={onVerifyOtp}
          >
            <input
              className="rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              style={inputStyle}
              value={otpCode}
              onChange={event => onOtpCodeChange(event.target.value)}
              placeholder="Enter 6-digit OTP"
              required
            />
            <Button
              type="submit"
              loading={actionLoading}
              variant="primary"
              className="px-8"
            >
              Verify
            </Button>
          </form>
        </div>
      ) : null}

      {!requiresLogin && !requiresOtp ? (
        <p className="text-sm" style={{ color: 'var(--muted-text)' }}>
          Verification is being finalized. Refresh access state and continue.
        </p>
      ) : null}
    </div>
  )
}

export default ExamEntryVerificationPanel
