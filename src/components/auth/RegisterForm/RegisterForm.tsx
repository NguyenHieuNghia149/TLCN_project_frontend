import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../../store/stores'
import {
  clearFieldError,
  clearError,
  sendOTP,
  setPendingRegistration,
} from '../../../store/slices/authSlice'
import Input from '../../../components/common/Input/Input'
import Button from '../../common/Button/Button'
import Alert from '../../common/Alert/Alert'
import './RegisterForm.css'

interface FormData {
  firstname: string
  lastname: string
  email: string
  password: string
  passwordConfirm: string
}

interface FormErrors {
  firstname?: string
  lastname?: string
  email?: string
  password?: string
  passwordConfirm?: string
}

const RegisterForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading, error, fieldErrors, pendingRegistration } = useSelector(
    (state: RootState) => state.auth.register
  )

  const [formData, setFormData] = useState<FormData>({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [localErrors, setLocalErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (pendingRegistration) {
      setFormData(prev => ({
        ...prev,
        firstname: pendingRegistration.firstname ?? '',
        lastname: pendingRegistration.lastname ?? '',
        email: pendingRegistration.email ?? '',
        password: pendingRegistration.password ?? '',
        passwordConfirm: pendingRegistration.passwordConfirm ?? '',
      }))
    }
  }, [pendingRegistration])

  const handleChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }))
      setLocalErrors(prev => ({ ...prev, [field]: undefined }))
      dispatch(clearFieldError(field))
    }

  const validateField = (field: keyof FormData): string | undefined => {
    const value = formData[field]

    switch (field) {
      case 'firstname':
      case 'lastname':
        if (!value.trim())
          return `${field === 'firstname' ? 'First' : 'Last'} name is required`
        if (value.trim().length < 2) return 'Must be at least 2 characters'
        break
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return 'Invalid email format'
        break
      case 'password':
        if (!value) return 'Password is required'
        if (value.length < 6) return 'Must be at least 6 characters'
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Must contain uppercase, lowercase, and number'
        }
        break
      case 'passwordConfirm':
        if (!value) return 'Please confirm your password'
        if (value !== formData.password) return 'Passwords do not match'
        break
    }
    return undefined
  }

  const validateAll = (): boolean => {
    const errors: FormErrors = {}
    let isValid = true

    ;(Object.keys(formData) as Array<keyof FormData>).forEach(field => {
      const error = validateField(field)
      if (error) {
        errors[field] = error
        isValid = false
      }
    })

    setLocalErrors(errors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateAll()) {
      return
    }

    // Save form data and request OTP, then move to OTP step
    dispatch(setPendingRegistration({ ...formData }))
    dispatch(sendOTP(formData.email))
  }

  const mergedErrors = { ...localErrors, ...fieldErrors }

  return (
    <div className="register-form">
      <div className="register-form__header">
        <h2 className="register-form__title">Create your account</h2>
        <p className="register-form__subtitle">
          Join us and start your coding journey
        </p>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => dispatch(clearError())}
        />
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="register-form__row">
          <Input
            label="First name"
            type="text"
            placeholder="John"
            value={formData.firstname}
            onChange={handleChange('firstname')}
            onBlur={() => {
              const error = validateField('firstname')
              if (error) setLocalErrors(prev => ({ ...prev, firstname: error }))
            }}
            error={mergedErrors.firstname}
            required
            disabled={isLoading}
            tone="dark"
          />

          <Input
            label="Last name"
            type="text"
            placeholder="Doe"
            value={formData.lastname}
            onChange={handleChange('lastname')}
            onBlur={() => {
              const error = validateField('lastname')
              if (error) setLocalErrors(prev => ({ ...prev, lastname: error }))
            }}
            error={mergedErrors.lastname}
            required
            disabled={isLoading}
            tone="dark"
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange('email')}
          onBlur={() => {
            const error = validateField('email')
            if (error) setLocalErrors(prev => ({ ...prev, email: error }))
          }}
          error={mergedErrors.email}
          required
          disabled={isLoading}
          tone="dark"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          }
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a strong password"
          value={formData.password}
          onChange={handleChange('password')}
          onBlur={() => {
            const error = validateField('password')
            if (error) setLocalErrors(prev => ({ ...prev, password: error }))
          }}
          error={mergedErrors.password}
          required
          disabled={isLoading}
          tone="dark"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
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
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          }
        />

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter your password"
          value={formData.passwordConfirm}
          onChange={handleChange('passwordConfirm')}
          onBlur={() => {
            const error = validateField('passwordConfirm')
            if (error)
              setLocalErrors(prev => ({ ...prev, passwordConfirm: error }))
          }}
          error={mergedErrors.passwordConfirm}
          required
          disabled={isLoading}
          tone="dark"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          }
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
        >
          Create Account
        </Button>
      </form>
    </div>
  )
}

export default RegisterForm
