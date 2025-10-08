// Login.tsx
import React, { useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
// axios type removed
import { useAuth } from '../../../hooks/api/useAuth'
// Removed login rate limiting
import { LoginCredentials } from '../../../types/auth.types'
import '../../../styles/base/Login.css'
import '../../../styles/components/login-security.css'

// removed unused ApiErrorResponse

// Validation schema
const loginSchema = yup.object({
  email: yup
    .string()
    .email('Email is not valid')
    .required('Email is required')
    .max(255, 'Email is not valid'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is not valid'),
  rememberMe: yup.boolean().default(false),
})

type LoginFormData = yup.InferType<typeof loginSchema>

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError } = useAuth()

  // Security features removed: no rate limiting / lockout

  // Form handling with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onBlur', // Validate on blur for better UX
  })

  // Watch rememberMe for potential future use
  // const rememberMe = watch('rememberMe')

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  // Clear error when user starts typing
  const handleInputChange = useCallback(() => {
    if (error) {
      clearError()
    }
    if (loginError) {
      setLoginError(null)
    }
  }, [error, clearError, loginError, setLoginError])

  // Submit handler without client-side rate limiting
  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      try {
        // Clear any existing error
        setLoginError(null)

        const credentials = {
          email: data.email,
          password: data.password,
        } as LoginCredentials

        await login(credentials)

        // Redirect to home or intended page
        const redirectTo = location.state?.from?.pathname || '/'
        navigate(redirectTo)
      } catch (err) {
        console.error('Login error:', err)
        // Always show a clear, user-friendly message and keep inputs intact
        setLoginError('Invalid email or password.')
        return
      }
    },
    [login, navigate, location.state]
  )

  // Handle form submission with loading state
  const handleFormSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      e.stopPropagation()
      await handleSubmit(onSubmit)()
    },
    [handleSubmit, onSubmit]
  )

  return (
    <div className="login-page">
      <div className="login-page__background">
        <div className="login-page__blob login-page__blob--one" />
        <div className="login-page__blob login-page__blob--two" />
        <div className="login-page__grid" />
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-card__left">
            <div className="login-hero">
              <div className="login-hero__content">
                <div className="login-hero__badge">Code & Learn</div>
                <h1 className="login-hero__title">
                  Level Up Your Skills, Shape Your Future.
                </h1>
                <p className="login-hero__desc">
                  Solve challenges, run tests, and level up your skills with our
                  modern platform.
                </p>
              </div>
              <div className="login-hero__image-wrapper">
                {/* <img
                  className="login-hero__image"
                  src={heroImg}
                  alt="Coding Illustration"
                /> */}
              </div>
            </div>
          </div>

          <div className="login-card__right">
            <div className="login-form-wrapper">
              <div
                className="form-row"
                style={{ justifyContent: 'flex-start', marginBottom: 8 }}
              >
                <button
                  type="button"
                  className="link"
                  onClick={() => navigate('/')}
                >
                  ← Back to Home
                </button>
              </div>
              <div className="login-form__header">
                <h2>Welcome back</h2>
                <p>Sign in to continue your coding journey</p>
              </div>

              {loginError && (
                <div className="login-form__error" role="alert">
                  {loginError}
                </div>
              )}

              {/* Security status display removed */}

              <form
                className="login-form"
                onSubmit={handleFormSubmit}
                noValidate
              >
                <div className="form-field">
                  <label htmlFor="email">Email</label>
                  <div className="input-group">
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...register('email', {
                        onChange: handleInputChange,
                      })}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={
                        errors.email ? 'email-error' : undefined
                      }
                      className={errors.email ? 'input-error' : ''}
                    />
                  </div>
                  {errors.email && (
                    <div
                      id="email-error"
                      className="form-field__error"
                      role="alert"
                    >
                      {errors.email.message}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="password">Password</label>
                  <div className="input-group">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      {...register('password', {
                        onChange: handleInputChange,
                      })}
                      aria-invalid={errors.password ? 'true' : 'false'}
                      aria-describedby={
                        errors.password ? 'password-error' : undefined
                      }
                      className={errors.password ? 'input-error' : ''}
                    />
                    <button
                      type="button"
                      className="input-group__toggle"
                      onClick={togglePassword}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      tabIndex={-1}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {errors.password && (
                    <div
                      id="password-error"
                      className="form-field__error"
                      role="alert"
                    >
                      {errors.password.message}
                    </div>
                  )}
                </div>

                <div className="form-row">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      {...register('rememberMe')}
                      aria-describedby="remember-me-description"
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="/forgetpassword" className="link">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading || isSubmitting}
                  aria-describedby="login-button-description"
                >
                  {isLoading || isSubmitting ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
                <div id="login-button-description" className="sr-only">
                  {isLoading || isSubmitting
                    ? 'Please wait while we sign you in'
                    : 'Click to sign in to your account'}
                </div>

                <div className="form-footer">
                  Don&apos;t have an account?{' '}
                  <a className="link" href="/register">
                    Create one
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
