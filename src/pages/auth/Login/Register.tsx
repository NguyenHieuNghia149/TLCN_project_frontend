import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '../../../styles/base/Register.css'
import { authService } from '../../../services/auth/auth.service'

const Register: React.FC = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{
    firstname?: string
    lastname?: string
    email?: string
    password?: string
    confirmPassword?: string
    otp?: string
  }>({})
  const [otp, setOtp] = useState('')
  const [otpCooldown, setOtpCooldown] = useState(0)
  const canSendOtp = useMemo(
    () => email.trim().length > 0 && otpCooldown === 0,
    [email, otpCooldown]
  )

  const togglePassword = () => setShowPassword(!showPassword)

  const validateField = useCallback(
    (field: keyof typeof fieldErrors) => {
      const nextError: Partial<typeof fieldErrors> = {}
      if (field === 'firstname') {
        if (!firstname.trim()) nextError.firstname = 'First name is required'
      }
      if (field === 'lastname') {
        if (!lastname.trim()) nextError.lastname = 'Last name is required'
      }
      if (field === 'email') {
        if (!email.trim()) nextError.email = 'Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          nextError.email = 'Email is not valid'
      }
      if (field === 'password') {
        if (!password) nextError.password = 'Password is required'
        else if (password.length < 6)
          nextError.password = 'Password must be at least 6 characters'
      }
      if (field === 'confirmPassword') {
        if (!confirmPassword)
          nextError.confirmPassword = 'Please confirm your password'
        else if (password !== confirmPassword)
          nextError.confirmPassword = 'Passwords do not match'
      }
      if (field === 'otp') {
        if (!otp.trim()) nextError.otp = 'OTP is required'
        else if (!/^\d{4,8}$/.test(otp))
          nextError.otp = 'OTP must be 4-8 digits'
      }
      setFieldErrors(prev => ({ ...prev, ...nextError }))
    },
    [firstname, lastname, email, password, confirmPassword, otp]
  )

  const validate = useCallback(() => {
    const nextErrors: typeof fieldErrors = {}

    if (!firstname.trim()) {
      nextErrors.firstname = 'First name is required'
    }
    if (!lastname.trim()) {
      nextErrors.lastname = 'Last name is required'
    }
    if (!email.trim()) {
      nextErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Email is not valid'
    }
    if (!password) {
      nextErrors.password = 'Password is required'
    } else if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters'
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match'
    }
    if (!otp.trim()) {
      nextErrors.otp = 'OTP is required'
    } else if (!/^\d{4,8}$/.test(otp)) {
      nextErrors.otp = 'OTP must be 4-8 digits'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }, [firstname, lastname, email, password, confirmPassword, otp])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setIsLoading(true)
    try {
      // TODO: integrate with your register API
      // await registerUser({ firstname, lastname, email, password, verifyEmailCode: otp })
      navigate('/login')
    } catch (err: unknown) {
      let message = 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
      if (err && typeof err === 'object') {
        if ('message' in err && typeof (err as Error).message === 'string') {
          message = (err as Error).message
        } else if (
          'response' in err &&
          typeof (err as { response?: { data?: { message?: string } } })
            .response?.data?.message === 'string'
        ) {
          message = (err as { response: { data: { message: string } } })
            .response.data.message
        }
      }
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendOtp = useCallback(async () => {
    if (!email.trim()) {
      setFieldErrors(prev => ({ ...prev, email: 'Email is required' }))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Email is not valid' }))
      return
    }
    try {
      await authService.requestRegisterOtp(email)
      setOtp('')
      // start cooldown 60s
      setOtpCooldown(60)
      const timer = setInterval(() => {
        setOtpCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      let message = 'Không thể gửi OTP. Vui lòng thử lại.'
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as Error).message === 'string'
      ) {
        message = (err as Error).message
      }
      setError(message)
    }
  }, [email])

  return (
    <div className="reg-page">
      <div className="reg-page__background">
        <div className="reg-page__blob reg-page__blob--one" />
        <div className="reg-page__blob reg-page__blob--two" />
        <div className="reg-page__grid" />
      </div>

      <div className="reg-container">
        <div className="reg-card">
          <div className="reg-card__left">
            <div className="reg-hero">
              <div className="reg-hero__content">
                <div className="reg-hero__badge">Code & Learn</div>
                <h1 className="reg-hero__title">Create your account</h1>
                <p className="reg-hero__desc">
                  Join challenges, track progress, and sharpen your skills.
                </p>
              </div>
              <div className="reg-hero__image-wrapper">
                {/* <img
                  className="reg-hero__image"
                  src={heroImg}
                  alt="Coding Illustration"
                /> */}
              </div>
            </div>
          </div>

          <div className="reg-card__right">
            <div className="reg-form-wrapper">
              <div className="reg-form__header">
                <h2>Sign up</h2>
                <p>Start your coding journey today</p>
              </div>

              {error && <div className="reg-form__error">{error}</div>}

              <form className="reg-form" onSubmit={handleSubmit} noValidate>
                <div className="form-row two-cols">
                  <div className="form-field">
                    <label>First name</label>
                    <div className="input-group">
                      <input
                        type="text"
                        placeholder="Jane"
                        value={firstname}
                        onChange={e => {
                          setFirstname(e.target.value)
                          if (fieldErrors.firstname)
                            setFieldErrors(prev => ({
                              ...prev,
                              firstname: undefined,
                            }))
                        }}
                        onBlur={() => validateField('firstname')}
                        aria-invalid={!!fieldErrors.firstname}
                        className={fieldErrors.firstname ? 'input-error' : ''}
                      />
                    </div>
                    {fieldErrors.firstname && (
                      <div className="form-field__error" role="alert">
                        {fieldErrors.firstname}
                      </div>
                    )}
                  </div>
                  <div className="form-field">
                    <label>Last name</label>
                    <div className="input-group">
                      <input
                        type="text"
                        placeholder="Doe"
                        value={lastname}
                        onChange={e => {
                          setLastname(e.target.value)
                          if (fieldErrors.lastname)
                            setFieldErrors(prev => ({
                              ...prev,
                              lastname: undefined,
                            }))
                        }}
                        onBlur={() => validateField('lastname')}
                        aria-invalid={!!fieldErrors.lastname}
                        className={fieldErrors.lastname ? 'input-error' : ''}
                      />
                    </div>
                    {fieldErrors.lastname && (
                      <div className="form-field__error" role="alert">
                        {fieldErrors.lastname}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <label>Email</label>
                  <div className="input-group">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value)
                        if (fieldErrors.email)
                          setFieldErrors(prev => ({
                            ...prev,
                            email: undefined,
                          }))
                      }}
                      onBlur={() => validateField('email')}
                      aria-invalid={!!fieldErrors.email}
                      className={fieldErrors.email ? 'input-error' : ''}
                    />
                  </div>
                  {fieldErrors.email && (
                    <div className="form-field__error" role="alert">
                      {fieldErrors.email}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label>OTP</label>
                  <div className="input-group">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter OTP code"
                      value={otp}
                      onChange={e => {
                        const v = e.target.value.replace(/[^0-9]/g, '')
                        setOtp(v)
                        if (fieldErrors.otp)
                          setFieldErrors(prev => ({ ...prev, otp: undefined }))
                      }}
                      onBlur={() => validateField('otp')}
                      aria-invalid={!!fieldErrors.otp}
                      className={fieldErrors.otp ? 'input-error' : ''}
                    />
                    <button
                      type="button"
                      className="otp-button"
                      onClick={handleSendOtp}
                      disabled={!canSendOtp}
                      aria-label="Send OTP"
                    >
                      {otpCooldown > 0
                        ? `Resend in ${otpCooldown}s`
                        : 'Get OTP'}
                    </button>
                  </div>
                  {fieldErrors.otp && (
                    <div className="form-field__error" role="alert">
                      {fieldErrors.otp}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label>Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value)
                        if (fieldErrors.password)
                          setFieldErrors(prev => ({
                            ...prev,
                            password: undefined,
                          }))
                      }}
                      onBlur={() => validateField('password')}
                      aria-invalid={!!fieldErrors.password}
                      className={fieldErrors.password ? 'input-error' : ''}
                    />
                    <button
                      type="button"
                      className="input-group__toggle"
                      onClick={togglePassword}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <div className="form-field__error" role="alert">
                      {fieldErrors.password}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label>Confirm password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value)
                        if (fieldErrors.confirmPassword)
                          setFieldErrors(prev => ({
                            ...prev,
                            confirmPassword: undefined,
                          }))
                      }}
                      onBlur={() => validateField('confirmPassword')}
                      aria-invalid={!!fieldErrors.confirmPassword}
                      className={
                        fieldErrors.confirmPassword ? 'input-error' : ''
                      }
                    />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <div className="form-field__error" role="alert">
                      {fieldErrors.confirmPassword}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? <span className="spinner" /> : 'Create account'}
                </button>

                <div className="form-footer">
                  Already have an account?{' '}
                  <Link className="link" to="/login">
                    Sign in
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
