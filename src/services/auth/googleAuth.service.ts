// API_BASE_URL no longer used here; backend call is handled by authService/login thunk
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

type GoogleIdCredential = { credential: string }

type GoogleIdInitializeConfig = {
  client_id: string
  callback: (response: GoogleIdCredential) => void
}

type GoogleOneTapPromptNotification = {
  isNotDisplayed: () => boolean
  isSkippedMoment: () => boolean
}

type GoogleIdRenderOptions = {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  type?: 'standard' | 'icon'
  text?: 'continue_with' | 'signin_with' | 'signup_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
}

type GoogleAccountsId = {
  initialize: (config: GoogleIdInitializeConfig) => void
  prompt: (cb?: (n: GoogleOneTapPromptNotification) => void) => void
  renderButton: (el: HTMLElement, options?: GoogleIdRenderOptions) => void
  disableAutoSelect: () => void
  cancel: () => void
}

type GoogleOAuth2 = {
  initTokenClient: (config: {
    client_id: string
    scope: string
    callback: (response: { access_token?: string }) => void
  }) => { requestAccessToken: () => void }
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId
        oauth2: GoogleOAuth2
      }
    }
  }
}

// Removed backend response type; backend auth handled elsewhere

class GoogleAuthService {
  initGoogleAuth(): void {
    if (window.google) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  }

  signInWithGoogle(): Promise<string> {
    const waitForGoogle = (timeoutMs = 5000) =>
      new Promise<void>((resolve, reject) => {
        if (window.google?.accounts?.id) return resolve()
        const startedAt = Date.now()
        const timer = setInterval(() => {
          if (window.google?.accounts?.id) {
            clearInterval(timer)
            resolve()
          } else if (Date.now() - startedAt > timeoutMs) {
            clearInterval(timer)
            reject(
              new Error(
                'Google API not loaded. Current origin: ' +
                  window.location.origin
              )
            )
          }
        }, 100)
      })

    return new Promise((resolve, reject) => {
      if (!GOOGLE_CLIENT_ID) {
        reject(
          new Error(
            'Missing Google Client ID. Please set VITE_GOOGLE_CLIENT_ID in .env file'
          )
        )
        return
      }

      const currentOrigin = window.location.origin

      waitForGoogle()
        .then(() => {
          let settled = false

          window.google!.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: GoogleIdCredential) => {
              if (settled) return
              if (response && response.credential) {
                settled = true
                resolve(response.credential)
              } else {
                settled = true
                reject(new Error('No credential received from Google'))
              }
            },
          })

          // Try One Tap first
          try {
            window.google!.accounts.id.prompt(
              (notification?: GoogleOneTapPromptNotification) => {
                if (!notification || settled) return

                // Don't reject immediately - wait for button click or timeout
                // One Tap might not be available but button will work
              }
            )
          } catch {
            // Continue - button will still work
          }

          // Safety timeout
          setTimeout(() => {
            if (!settled) {
              settled = true
              reject(
                new Error(
                  `Google sign-in timed out. ` +
                    `Please ensure "${currentOrigin}" is added to Authorized JavaScript origins in Google Cloud Console. ` +
                    `Current Client ID: ${GOOGLE_CLIENT_ID.substring(0, 30)}...`
                )
              )
            }
          }, 10000)
        })
        .catch(err => {
          const error =
            err instanceof Error ? err : new Error('Google sign-in failed')
          reject(error)
        })
    })
  }

  renderGoogleButton(
    element: HTMLElement,
    onSuccess: (credential: string) => void,
    onError: (error: Error) => void
  ): void {
    if (!window.google?.accounts?.id) {
      onError(new Error('Google API not loaded. Please refresh the page.'))
      return
    }

    if (!GOOGLE_CLIENT_ID) {
      onError(
        new Error(
          'Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in .env file.'
        )
      )
      return
    }

    const currentOrigin = window.location.origin

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: GoogleIdCredential) => {
          if (response.credential) {
            onSuccess(response.credential)
          } else {
            onError(new Error('No credential received from Google button'))
          }
        },
      })

      window.google.accounts.id.renderButton(element, {
        theme: 'filled_blue',
        size: 'large',
        type: 'standard',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: element.offsetWidth || 300,
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to render Google button'
      onError(
        new Error(
          `${errorMessage}. ` +
            `Please ensure "${currentOrigin}" is in Authorized JavaScript origins. ` +
            `Client ID: ${GOOGLE_CLIENT_ID.substring(0, 30)}...`
        )
      )
    }
  }

  // authenticateWithBackend removed to avoid duplication with authService.loginWithGoogle

  signInWithPopup(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!window.google) {
        reject(new Error('Google API not loaded'))
        return
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: (response: { access_token?: string }) => {
          if (response.access_token) {
            resolve(response.access_token)
          } else {
            reject(new Error('No access token received'))
          }
        },
      })

      client.requestAccessToken()
    })
  }
}

export const googleAuthService = new GoogleAuthService()
