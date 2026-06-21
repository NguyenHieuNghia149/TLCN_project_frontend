import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { authService } from '@/services/auth/auth.service'
import './ForgotPassword.css'

type Step = 'email' | 'otp' | 'password'

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setInterval(() => {
        setOtpCooldown(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [otpCooldown])

  // Focus first OTP input on OTP step
  useEffect(() => {
    if (step === 'otp') {
      inputRefs.current[0]?.focus()
    }
  }, [step])

  const extractErrorMessage = (error: unknown, fallback: string): string => {
    if (isAxiosError(error)) {
      const message = error.response?.data?.message
      if (typeof message === 'string' && message.trim()) return message
    }
    if (error instanceof Error && error.message) {
      return error.message
    }
    if (typeof error === 'string' && error.trim()) {
      return error
    }
    return fallback
  }

  const handleSendOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldError(null)
    setError(null)

    if (!email.trim()) {
      setFieldError('Email is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('Email is not valid')
      return
    }

    try {
      setIsLoading(true)
      await authService.sendResetOtp(email)

      setError(null)
      setStep('otp')
      setOtp(['', '', '', '', '', ''])
      setOtpCooldown(60)
    } catch (err) {
      const errorMsg = extractErrorMessage(err, 'Failed to send OTP')
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOTPKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasteData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
    const newOtp = pasteData.split('').concat(Array(6).fill('')).slice(0, 6)
    setOtp(newOtp)

    const nextIndex = Math.min(pasteData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldError(null)
    setError(null)

    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setFieldError('Please enter a valid 6-digit code')
      return
    }

    try {
      setIsLoading(true)
      await authService.verifyOtp(email, otpCode)

      setError(null)
      setStep('password')
      setFieldError(null)
    } catch (err) {
      const errorMsg = extractErrorMessage(err, 'Invalid OTP')
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldError(null)
    setError(null)

    if (!newPassword.trim()) {
      setFieldError('New password is required')
      return
    }

    if (!confirmPassword.trim()) {
      setFieldError('Confirm password is required')
      return
    }

    if (newPassword.length < 8) {
      setFieldError('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setFieldError('Passwords do not match')
      return
    }

    try {
      setIsLoading(true)
      const otpCode = otp.join('')
      await authService.resetPassword(email, otpCode, newPassword)

      setError(null)
      setSuccessMessage('Password reset successfully! Redirecting to login...')
      // Reset all states and redirect after showing message
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } catch (err) {
      const errorMsg = extractErrorMessage(err, 'Failed to reset password')
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (otpCooldown > 0 || isLoading) return

    try {
      setIsLoading(true)
      await authService.sendResetOtp(email)
      setOtp(['', '', '', '', '', ''])
      setOtpCooldown(60)
      setError(null)
    } catch (err) {
      const errorMsg = extractErrorMessage(err, 'Failed to resend OTP')
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'otp') {
      setStep('email')
      setOtp(['', '', '', '', '', ''])
      setError(null)
      setFieldError(null)
    } else if (step === 'password') {
      setStep('otp')
      setNewPassword('')
      setConfirmPassword('')
      setError(null)
      setFieldError(null)
    }
  }

  return (
    <div className="fp-page">
      <div className="fp-page__background">
        <div className="fp-page__blob fp-page__blob--one" />
        <div className="fp-page__blob fp-page__blob--two" />
        <div className="fp-page__grid" />
      </div>

      <div className="fp-container">
        <div className="fp-card">
          <div className="fp-card__left">
            <div className="fp-hero">
              <div className="fp-hero__content">
                <div className="fp-hero__badge">Code & Learn</div>
                <h1 className="fp-hero__title">
                  {step === 'email' && 'Forgot your password?'}
                  {step === 'otp' && 'Verify your email'}
                  {step === 'password' && 'Set new password'}
                </h1>
                <p className="fp-hero__desc">
                  {step === 'email' &&
                    "Enter your email address and we'll send you a reset code."}
                  {step === 'otp' &&
                    'Enter the 6-digit code we sent to your email.'}
                  {step === 'password' &&
                    'Create a strong new password for your account.'}
                </p>
              </div>
              <div className="fp-hero__image-wrapper">
                {/* <img
                  className="fp-hero__image"
                  src={heroImg}
                  alt="Coding Illustration"
                /> */}
              </div>
            </div>
          </div>

          <div className="fp-card__right">
            <div className="fp-form-wrapper">
              {step !== 'email' && (
                <button
                  className="fp-back-button"
                  onClick={handleBack}
                  type="button"
                  disabled={isLoading}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Back
                </button>
              )}

              <div className="fp-form__header">
                <h2>
                  {step === 'email' && 'Password reset'}
                  {step === 'otp' && 'Verify OTP'}
                  {step === 'password' && 'New password'}
                </h2>
                <p>
                  {step === 'email' && "We'll email you a reset code"}
                  {step === 'otp' && `Code sent to ${email}`}
                  {step === 'password' && 'Create a strong new password'}
                </p>
              </div>

              {error && <div className="fp-form__error">{error}</div>}

              {successMessage && (
                <div className="fp-form__success">{successMessage}</div>
              )}

              {/* Step 1: Email Input */}
              {step === 'email' && (
                <form className="fp-form" onSubmit={handleSendOTP}>
                  <div className="form-field">
                    <label>Email</label>
                    <div className="input-group">
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => {
                          setEmail(e.target.value)
                          if (fieldError) setFieldError(null)
                        }}
                        aria-invalid={fieldError ? 'true' : 'false'}
                        className={fieldError ? 'input-error' : ''}
                        disabled={isLoading}
                      />
                    </div>
                    {fieldError && (
                      <div className="form-field__error" role="alert">
                        {fieldError}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="spinner" />
                    ) : (
                      'Send reset OTP'
                    )}
                  </button>

                  <div className="form-footer">
                    Remembered your password?{' '}
                    <Link className="link" to="/login">
                      Back to sign in
                    </Link>
                  </div>
                </form>
              )}

              {/* Step 2: OTP Verification */}
              {step === 'otp' && (
                <form className="fp-form" onSubmit={handleVerifyOTP}>
                  <div className="otp-inputs" onPaste={handleOTPPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => {
                          inputRefs.current[index] = el
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOTPChange(index, e.target.value)}
                        onKeyDown={e => handleOTPKeyDown(index, e)}
                        className="otp-input"
                        disabled={isLoading}
                        aria-label={`Digit ${index + 1}`}
                      />
                    ))}
                  </div>

                  {fieldError && (
                    <div className="form-field__error" role="alert">
                      {fieldError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading || otp.join('').length !== 6}
                  >
                    {isLoading ? <span className="spinner" /> : 'Verify OTP'}
                  </button>

                  <div className="fp-otp-footer">
                    <p className="fp-otp-footer-text">
                      Didn't receive the code?
                    </p>
                    <button
                      type="button"
                      className="fp-resend-button"
                      onClick={handleResendOTP}
                      disabled={otpCooldown > 0 || isLoading}
                    >
                      {otpCooldown > 0
                        ? `Resend in ${otpCooldown}s`
                        : 'Resend Code'}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: New Password */}
              {step === 'password' && (
                <form className="fp-form" onSubmit={handleResetPassword}>
                  <div className="form-field">
                    <label>New Password</label>
                    <div className="input-group">
                      <input
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={e => {
                          setNewPassword(e.target.value)
                          if (fieldError) setFieldError(null)
                        }}
                        aria-invalid={fieldError ? 'true' : 'false'}
                        className={fieldError ? 'input-error' : ''}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Confirm Password</label>
                    <div className="input-group">
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={e => {
                          setConfirmPassword(e.target.value)
                          if (fieldError) setFieldError(null)
                        }}
                        aria-invalid={fieldError ? 'true' : 'false'}
                        className={fieldError ? 'input-error' : ''}
                        disabled={isLoading}
                      />
                    </div>
                    {fieldError && (
                      <div className="form-field__error" role="alert">
                        {fieldError}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="spinner" />
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
