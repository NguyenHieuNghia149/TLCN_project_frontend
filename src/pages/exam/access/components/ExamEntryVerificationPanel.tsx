import React from 'react'

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
        <div>
          <p className="text-sm text-slate-300">
            Sign in with the account linked to this exam access.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="mt-4 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Sign in to continue
          </button>
        </div>
      ) : null}

      {requiresOtp ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Verify your email with OTP to continue.
          </p>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
              type="email"
              value={otpEmail}
              onChange={event => onOtpEmailChange(event.target.value)}
              placeholder="candidate@example.com"
            />
            <button
              type="button"
              onClick={onSendOtp}
              disabled={actionLoading || otpCooldown > 0}
              className="rounded-full border border-white/20 px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Send OTP'}
            </button>
          </div>
          <form
            className="grid gap-3 md:grid-cols-[1fr_auto]"
            onSubmit={onVerifyOtp}
          >
            <input
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
              value={otpCode}
              onChange={event => onOtpCodeChange(event.target.value)}
              placeholder="OTP code"
              required
            />
            <button
              type="submit"
              disabled={actionLoading}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-200"
            >
              {actionLoading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </div>
      ) : null}

      {!requiresLogin && !requiresOtp ? (
        <p className="text-sm text-slate-300">
          Verification is being finalized. Refresh access state and continue.
        </p>
      ) : null}
    </div>
  )
}

export default ExamEntryVerificationPanel
