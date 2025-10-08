// Login.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import heroImg from '../../../assets/react.svg'
import './Login.css'

// NOTE: Keep existing auth wiring as-is in your project.
// If you have a useAuth or auth service, import and use it here.
// Example (uncomment and adjust paths to match your app):
// import { useAuth } from '../../../contexts/AuthContext/authContext';
// import { loginUser } from '../../../services/auth/auth.service';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  // const { login } = useAuth();

  const togglePassword = () => {
    setShowPassword(!showPassword)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // const userData = await loginUser(email, password);
      // login(userData);
      navigate('/')
    } catch (err: unknown) {
      console.error('Lỗi không xác định:', err)

      // Lấy message từ error object
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại sau.'

      if (err && typeof err === 'object') {
        if ('message' in err && typeof (err as Error).message === 'string') {
          errorMessage = (err as Error).message
        } else if (
          'response' in err &&
          typeof (err as { response?: { data?: { message?: string } } })
            .response?.data?.message === 'string'
        ) {
          errorMessage = (err as { response: { data: { message: string } } })
            .response.data.message
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

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
                <img
                  className="login-hero__image"
                  src={heroImg}
                  alt="Coding Illustration"
                />
              </div>
            </div>
          </div>

          <div className="login-card__right">
            <div className="login-form-wrapper">
              <div className="login-form__header">
                <h2>Welcome back</h2>
                <p>Sign in to continue your coding journey</p>
              </div>

              {error && <div className="login-form__error">{error}</div>}

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-field">
                  <label>Email</label>
                  <div className="input-group">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
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
                </div>

                <div className="form-row">
                  <label className="checkbox">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <a href="/forgetpassword" className="link">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? <span className="spinner" /> : 'Sign in'}
                </button>

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
