import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import heroImg from '../../../assets/react.svg'
import '../../../styles/base/Register.css'

const Register: React.FC = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const togglePassword = () => setShowPassword(!showPassword)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      // TODO: integrate with your register API
      // await registerUser({ fullName, email, password })
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
                <img
                  className="reg-hero__image"
                  src={heroImg}
                  alt="Coding Illustration"
                />
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

              <form className="reg-form" onSubmit={handleSubmit}>
                <div className="form-field">
                  <label>Full name</label>
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

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
                      placeholder="Create a strong password"
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

                <div className="form-field">
                  <label>Confirm password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
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
