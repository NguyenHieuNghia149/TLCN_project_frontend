import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import heroImg from '../../assets/react.svg'
import './ForgotPassword.css'

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle'
  )
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('sending')
    setMessage('')
    try {
      // TODO: call your password reset API, e.g. requestPasswordReset(email)
      await new Promise(r => setTimeout(r, 900))
      setStatus('sent')
      setMessage('We have sent a password reset link to your email.')
    } catch (err: unknown) {
      setStatus('error')
      let msg = 'Unable to send reset email. Please try again later.'
      if (
        err &&
        typeof err === 'object' &&
        'message' in err &&
        typeof (err as Error).message === 'string'
      ) {
        msg = (err as Error).message
      }
      setMessage(msg)
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
                <h1 className="fp-hero__title">Forgot your password?</h1>
                <p className="fp-hero__desc">
                  Enter your email address and we&apos;ll send you a reset link.
                </p>
              </div>
              <div className="fp-hero__image-wrapper">
                <img
                  className="fp-hero__image"
                  src={heroImg}
                  alt="Coding Illustration"
                />
              </div>
            </div>
          </div>

          <div className="fp-card__right">
            <div className="fp-form-wrapper">
              <div className="fp-form__header">
                <h2>Password reset</h2>
                <p>We&apos;ll email instructions to reset your password</p>
              </div>

              {message && (
                <div
                  className="fp-form__error"
                  style={{
                    background:
                      status === 'error'
                        ? 'rgba(239,68,68,0.1)'
                        : 'rgba(34,197,94,0.1)',
                    borderColor:
                      status === 'error'
                        ? 'rgba(239,68,68,0.35)'
                        : 'rgba(34,197,94,0.35)',
                    color: status === 'error' ? '#fecaca' : '#bbf7d0',
                  }}
                >
                  {message}
                </div>
              )}

              <form className="fp-form" onSubmit={handleSubmit}>
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

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? (
                    <span className="spinner" />
                  ) : (
                    'Send reset link'
                  )}
                </button>

                <div className="form-footer">
                  Remembered your password?{' '}
                  <Link className="link" to="/login">
                    Back to sign in
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

export default ForgotPassword
