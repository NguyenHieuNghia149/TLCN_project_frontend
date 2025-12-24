import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useDispatch, useSelector } from 'react-redux'
import { App as AntdApp } from 'antd'
import { AppDispatch, RootState } from '../../../store/stores'
import {
  clearLoginError,
  clearLoginFieldError,
  loginUser,
  loginWithGoogle,
} from '../../../store/slices/authSlice'
import type { LoginCredentials } from '../../../types/auth.types'
import Alert from '../../../components/common/Alert/Alert'
import Input from '../../../components/common/Input/Input'
import Button from '../../../components/common/Button/Button'
import GoogleButton from '../../../components/auth/GoogleButton/GoogleButton'
import { googleAuthService } from '../../../services/auth/googleAuth.service'
import './Login.css'

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

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch<AppDispatch>()
  const { message } = AntdApp.useApp()

  const { isLoading: sessionLoading } = useSelector(
    (state: RootState) => state.auth.session
  )
  const {
    isLoading: loginLoading,
    error: loginError,
    fieldErrors,
    lastAttempt,
  } = useSelector((state: RootState) => state.auth.login)

  // Form handling with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (lastAttempt) {
      setValue('email', lastAttempt.email, { shouldDirty: true })
      setValue('password', lastAttempt.password, { shouldDirty: true })
      setValue('rememberMe', lastAttempt.rememberMe ?? false, {
        shouldDirty: true,
      })
    }
  }, [lastAttempt, setValue])

  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  const handleInputChange = useCallback(
    (field?: keyof LoginFormData) => {
      if (loginError) {
        dispatch(clearLoginError())
      }
      if (field) {
        dispatch(clearLoginFieldError(field))
      }
    },
    [dispatch, loginError]
  )

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      try {
        dispatch(clearLoginError())

        const credentials: LoginCredentials = {
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        }

        await dispatch(loginUser(credentials)).unwrap()
        message.success('Login successful!')

        const redirectTo = location.state?.from?.pathname || '/'
        navigate(redirectTo)
      } catch {
        // Error handled by Redux
      }
    },
    [dispatch, navigate, location.state, message]
  )

  const handleFormSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      e.stopPropagation()
      await handleSubmit(onSubmit)()
    },
    [handleSubmit, onSubmit]
  )

  const handleGoogleSuccess = useCallback(
    (credential: string) => {
      dispatch(loginWithGoogle(credential)).then(() => {
        message.success('Login with Google successful!')
      })
    },
    [dispatch, message]
  )

  const handleGoogleError = useCallback(() => {
    // Fallback: try One Tap prompt
    googleAuthService.initGoogleAuth()
    googleAuthService
      .signInWithGoogle()
      .then(credential => {
        dispatch(loginWithGoogle(credential)).then(() => {
          message.success('Login with Google successful!')
        })
      })
      .catch(() => {
        // Error handled by Redux
      })
  }, [dispatch, message])

  return (
    <div className="login-page">
      <div className="login-page__background">
        <div className="login-page__blob login-page__blob--one" />
        <div className="login-page__blob login-page__blob--two" />
        <div className="login-page__grid" />
      </div>

      <div className="login-container">
        <div className="login-card">
          {/* Hero Section */}
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
                {/* Add your image here */}
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="login-card__right">
            <div className="login-form-wrapper">
              {/* Back to Home Link */}
              <div className="login-back-link">
                <button
                  type="button"
                  className="link"
                  onClick={() => navigate('/')}
                >
                  ← Back to Home
                </button>
              </div>

              {/* Header */}
              <div className="login-form__header">
                <h2>Welcome back</h2>
                <p>Sign in to continue your coding journey</p>
              </div>

              {/* Google Sign In Button */}
              <div className="login-google-wrapper">
                <GoogleButton
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="continue_with"
                  variant="minimal"
                  theme="filled_black"
                  size="large"
                  disabled={loginLoading || sessionLoading}
                />
              </div>

              {/* Divider */}
              <div className="login-divider">
                <span className="login-divider__line" />
                <span className="login-divider__text">
                  Or continue with email
                </span>
                <span className="login-divider__line" />
              </div>

              {/* Error Alert */}
              {loginError && (
                <Alert
                  type="error"
                  message={loginError}
                  onClose={() => dispatch(clearLoginError())}
                />
              )}

              {/* Login Form */}
              <form
                className="login-form"
                onSubmit={handleFormSubmit}
                noValidate
              >
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  tone="dark"
                  {...register('email', {
                    onChange: () => handleInputChange('email'),
                  })}
                  error={errors.email?.message || fieldErrors.email}
                  icon={
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  }
                />

                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  tone="dark"
                  {...register('password', {
                    onChange: () => handleInputChange('password'),
                  })}
                  error={errors.password?.message || fieldErrors.password}
                  icon={
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                  rightButton={
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={togglePassword}
                      tabIndex={-1}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  }
                />

                <div className="form-row">
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      {...register('rememberMe', {
                        onChange: () => handleInputChange(),
                      })}
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="/forgetpassword" className="link">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loginLoading || sessionLoading || isSubmitting}
                >
                  Sign in
                </Button>

                <div className="form-footer">
                  Don't have an account?{' '}
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
