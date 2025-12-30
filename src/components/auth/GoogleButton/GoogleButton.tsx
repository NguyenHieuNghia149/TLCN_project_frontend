import React, { useEffect, useRef } from 'react'
import { googleAuthService } from '../../../services/auth/googleAuth.service'
import './GoogleButton.css'

interface GoogleButtonProps {
  onSuccess: (credential: string) => void
  onError?: (error: Error) => void
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  width?: number
  logo_alignment?: 'left' | 'center'
  disabled?: boolean
  variant?: 'default' | 'modern' | 'minimal'
}

const GoogleButton: React.FC<GoogleButtonProps> = ({
  onSuccess,
  onError,
  text = 'continue_with',
  theme = 'filled_blue',
  size = 'large',
  width,
  logo_alignment = 'left',
  disabled = false,
  variant = 'modern',
}) => {
  const buttonRef = useRef<HTMLDivElement>(null)
  const customButtonRef = useRef<HTMLButtonElement>(null)
  const [isGoogleLoaded, setIsGoogleLoaded] = React.useState(false)

  // Render native Google button (hidden when using custom variant)
  useEffect(() => {
    if (disabled) return

    googleAuthService.initGoogleAuth()

    const intervalRef = { current: null as NodeJS.Timeout | null }
    let attempts = 0
    const maxAttempts = 50 // 5 seconds total

    const checkAndInit = () => {
      if (buttonRef.current && window.google?.accounts?.id) {
        if (intervalRef.current) clearInterval(intervalRef.current)

        try {
          const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
          if (!clientId) {
            onError?.(new Error('Google Client ID not configured'))
            return
          }

          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: { credential: string }) => {
              if (response.credential) {
                onSuccess(response.credential)
              } else {
                onError?.(new Error('No credential received'))
              }
            },
          })

          // Always render the native button (even if hidden) so it can be triggered
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme,
            size,
            text,
            width: width || buttonRef.current.offsetWidth || 300,
            logo_alignment,
          })

          // Mark as loaded ONLY after successful init and render
          setIsGoogleLoaded(true)
        } catch (err) {
          setIsGoogleLoaded(false)
          onError?.(err as Error)
        }
      } else {
        attempts++
        if (attempts >= maxAttempts) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          console.warn('Google Sign-In script failed to load within timeout.')
        }
      }
    }

    // Check immediately first
    checkAndInit()

    // Then poll
    intervalRef.current = setInterval(checkAndInit, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      // Clean up Google One Tap/Button state on unmount
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
      }
    }
  }, [onSuccess, onError, text, theme, size, width, logo_alignment, disabled])

  const getButtonText = () => {
    switch (text) {
      case 'signin_with':
        return 'Sign in with Google'
      case 'signup_with':
        return 'Sign up with Google'
      case 'signin':
        return 'Sign in'
      default:
        return 'Continue with Google'
    }
  }

  const GoogleIcon = () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.9895 10.1871C19.9895 9.36767 19.9214 8.76973 19.7742 8.14966H10.1992V11.848H15.8195C15.7062 12.7671 15.0943 14.1512 13.7346 15.0813L13.7155 15.2051L16.7429 17.4969L16.9527 17.5174C18.8789 15.7789 19.9895 13.221 19.9895 10.1871Z"
        fill="#4285F4"
      />
      <path
        d="M10.1993 19.9313C12.9527 19.9313 15.2643 19.0454 16.9527 17.5174L13.7346 15.0813C12.8734 15.6682 11.7176 16.0779 10.1993 16.0779C7.50243 16.0779 5.21352 14.3395 4.39759 11.9366L4.27799 11.9465L1.13003 14.3273L1.08887 14.4391C2.76588 17.6945 6.21061 19.9313 10.1993 19.9313Z"
        fill="#34A853"
      />
      <path
        d="M4.39748 11.9366C4.18219 11.3166 4.05759 10.6521 4.05759 9.96565C4.05759 9.27909 4.18219 8.61473 4.38615 7.99466L4.38045 7.8626L1.19304 5.44366L1.08875 5.49214C0.397576 6.84305 0.000976562 8.36008 0.000976562 9.96565C0.000976562 11.5712 0.397576 13.0882 1.08875 14.4391L4.39748 11.9366Z"
        fill="#FBBC05"
      />
      <path
        d="M10.1993 3.85336C12.1142 3.85336 13.406 4.66168 14.1425 5.33717L17.0207 2.59107C15.253 0.985496 12.9527 0 10.1993 0C6.2106 0 2.76588 2.23672 1.08887 5.49214L4.38626 7.99466C5.21352 5.59183 7.50242 3.85336 10.1993 3.85336Z"
        fill="#EB4335"
      />
    </svg>
  )

  if (disabled) {
    return (
      <button
        className={`google-button google-button--disabled google-button--${variant}`}
        disabled
      >
        <GoogleIcon />
        <span>{getButtonText()}</span>
      </button>
    )
  }

  return (
    <div className="google-button-container">
      {/* Native Google Button (hidden when using custom variant) */}
      <div
        ref={buttonRef}
        className={`google-button-native ${variant !== 'default' ? 'google-button-native--hidden' : ''}`}
        style={{ opacity: isGoogleLoaded && variant === 'default' ? 1 : 0 }}
      />

      {/* Custom Modern Button */}
      {variant !== 'default' && (
        <button
          ref={customButtonRef}
          className={`google-button google-button--${variant} google-button--${theme}`}
          onClick={() => {
            try {
              console.log('Google button clicked. Ready state:', isGoogleLoaded)

              if (!isGoogleLoaded) {
                console.warn('Google Auth not yet loaded')
                return
              }

              // Direct synchronous click to preserve User Activation for popups
              if (buttonRef.current) {
                const nativeButton = buttonRef.current.querySelector(
                  'div[role="button"]'
                ) as HTMLElement

                const firstChild = buttonRef.current
                  .firstElementChild as HTMLElement

                if (nativeButton) {
                  console.log('Clicking native button (div[role=button])')
                  nativeButton.click()
                } else if (firstChild) {
                  console.log('Clicking native button (firstChild)')
                  firstChild.click()
                } else {
                  console.error(
                    'Native Google button structure not found during click'
                  )
                  onError?.(
                    new Error('Google button not ready. Please refresh.')
                  )
                }
              } else {
                console.error('Button container ref missing')
              }
            } catch (err) {
              console.error('Google Sign-In Click Error:', err)
              onError?.(err as Error)
            }
          }}
          disabled={disabled || !isGoogleLoaded}
          type="button"
        >
          <div className="google-button__icon">
            <GoogleIcon />
          </div>
          <span className="google-button__text">{getButtonText()}</span>
        </button>
      )}
    </div>
  )
}

export default GoogleButton
