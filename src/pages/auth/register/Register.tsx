import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../../store/stores'
import { resetAuth } from '../../../store/slices/authSlice'
import RegisterForm from '../../../components/auth/RegisterForm/RegisterForm'
import OTPVerification from '../../../components/auth/OTPVerification/OTPVerification'
import './Register.css'

const Register: React.FC = () => {
  const dispatch = useDispatch()
  const { step } = useSelector((state: RootState) => state.auth.register)

  useEffect(() => {
    // Reset auth state when component unmounts
    return () => {
      dispatch(resetAuth())
    }
  }, [dispatch])

  return (
    <div className="register-page">
      {/* Animated Background */}
      <div className="register-background">
        <div className="register-blob register-blob--one" />
        <div className="register-blob register-blob--two" />
        <div className="register-blob register-blob--three" />
        <div className="register-grid" />
      </div>

      <div className="register-container">
        <div className="register-card">
          {/* Left Side - Hero Section */}
          <div className="register-hero">
            <div className="register-hero__content">
              <div className="register-hero__badge">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                Code & Learn
              </div>

              <h1 className="register-hero__title">
                Start Your
                <br />
                Coding Journey
              </h1>

              <p className="register-hero__description">
                Join thousands of developers improving their skills through
                challenges and practice.
              </p>

              <div className="register-hero__features">
                <div className="feature-item">
                  <div className="feature-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <span>Interactive challenges</span>
                </div>

                <div className="feature-item">
                  <div className="feature-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M18 20V10" />
                      <path d="M12 20V4" />
                      <path d="M6 20v-6" />
                    </svg>
                  </div>
                  <span>Track your progress</span>
                </div>

                <div className="feature-item">
                  <div className="feature-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <span>Learn with community</span>
                </div>
              </div>
            </div>

            <div className="register-hero__illustration">
              <div className="code-window">
                <div className="code-window__header">
                  <span className="dot dot--red"></span>
                  <span className="dot dot--yellow"></span>
                  <span className="dot dot--green"></span>
                </div>
                <div className="code-window__content">
                  <div className="code-line">
                    <span className="code-keyword">const</span>{' '}
                    <span className="code-variable">developer</span> ={' '}
                    <span className="code-string">"you"</span>;
                  </div>
                  <div className="code-line">
                    <span className="code-keyword">console</span>.
                    <span className="code-method">log</span>(
                    <span className="code-string">"Welcome!"</span>);
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form Section */}
          <div className="register-form-section">
            <div className="register-form-wrapper">
              {step === 'register' ? <RegisterForm /> : <OTPVerification />}

              {step === 'register' && (
                <div className="register-footer">
                  <p>
                    Already have an account?{' '}
                    <Link to="/login" className="register-link">
                      Sign in
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
