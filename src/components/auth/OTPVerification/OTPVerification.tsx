import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { App as AntdApp } from 'antd'
import { AppDispatch, RootState } from '../../../store/stores'
import {
  sendOTP,
  clearError,
  decrementCooldown,
  setStep,
  registerUser,
} from '../../../store/slices/authSlice'
import Button from '../../common/Button/Button'
import Alert from '../../common/Alert/Alert'
import './OTPVerification.css'

const OTPVerification: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { message } = AntdApp.useApp()
  const {
    isLoading,
    error,
    registrationEmail,
    otpCooldown,
    pendingRegistration,
  } = useSelector((state: RootState) => state.auth.register)

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    // Countdown timer
    if (otpCooldown > 0) {
      const timer = setInterval(() => {
        dispatch(decrementCooldown())
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [otpCooldown, dispatch])

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only take last character

    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasteData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
    const newOtp = pasteData.split('').concat(Array(6).fill('')).slice(0, 6)
    setOtp(newOtp)

    // Focus last filled input or first empty
    const nextIndex = Math.min(pasteData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      return
    }

    if (!registrationEmail || !pendingRegistration) {
      return
    }

    const result = await dispatch(
      registerUser({ ...pendingRegistration, otp: otpCode })
    )

    if (registerUser.fulfilled.match(result)) {
      // Success - navigate to login
      message.success(
        'Registration successful! Please login with your credentials.'
      )
      navigate('/login', {
        state: {
          message:
            'Registration successful! Please login with your credentials.',
          email: registrationEmail,
        },
      })
    }
  }

  const handleResendOTP = async () => {
    if (!registrationEmail || otpCooldown > 0) return

    setOtp(['', '', '', '', '', ''])
    await dispatch(sendOTP(registrationEmail))
  }

  const handleBack = () => {
    dispatch(setStep('register'))
  }

  const otpCode = otp.join('')
  const isComplete = otpCode.length === 6

  return (
    <div className="otp-verification">
      <button className="otp-back-button" onClick={handleBack} type="button">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Back
      </button>

      <div className="otp-header">
        <div className="otp-icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="otp-title">Verify Your Email</h2>
        <p className="otp-subtitle">
          We've sent a 6-digit code to
          <br />
          <strong>{registrationEmail}</strong>
        </p>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => dispatch(clearError())}
        />
      )}

      <form onSubmit={handleSubmit}>
        <div className="otp-inputs" onPaste={handlePaste}>
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
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className="otp-input"
              disabled={isLoading}
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={!isComplete}
        >
          Verify Email
        </Button>
      </form>

      <div className="otp-footer">
        <p className="otp-footer-text">Didn't receive the code?</p>
        <button
          type="button"
          className="otp-resend-button"
          onClick={handleResendOTP}
          disabled={otpCooldown > 0 || isLoading}
        >
          {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Resend Code'}
        </button>
      </div>
    </div>
  )
}

export default OTPVerification
