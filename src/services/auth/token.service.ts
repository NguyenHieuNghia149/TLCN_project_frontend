import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  exp: number
  sub?: string
  iat?: number
  [key: string]: string | number | undefined
}

const ACCESS_TOKEN_STORAGE_KEY =
  import.meta.env.VITE_ACCESS_TOKEN_STORAGE_KEY || 'auth_access_token'

class TokenManager {
  private accessToken: string | null = null
  private tokenExpiryCheckInterval: NodeJS.Timeout | null = null
  private tokenRefreshCallback: (() => Promise<string>) | null = null

  constructor() {
    this.hydrateFromSessionStorage()
  }

  private hydrateFromSessionStorage(): void {
    if (typeof window === 'undefined') return
    try {
      const storedToken = window.sessionStorage.getItem(
        ACCESS_TOKEN_STORAGE_KEY
      )
      if (storedToken) {
        this.accessToken = storedToken
        if (this.isTokenExpired()) {
          this.clearAccessToken()
        } else {
          this.startExpiryCheck()
        }
      }
    } catch {
      // Ignore sessionStorage access issues
    }
  }

  private persistToken(token: string | null): void {
    if (typeof window === 'undefined') return
    try {
      if (token) {
        window.sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token)
      } else {
        window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
      }
    } catch {
      // Ignore storage errors
    }
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token
    this.persistToken(token)

    if (token) {
      this.startExpiryCheck()
    } else {
      this.stopExpiryCheck()
    }
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  clearAccessToken(): void {
    this.accessToken = null
    this.persistToken(null)
    this.stopExpiryCheck()
  }

  setTokenRefreshCallback(callback: () => Promise<string>): void {
    this.tokenRefreshCallback = callback
  }

  private getTokenExpiry(): number | null {
    if (!this.accessToken) return null

    try {
      const decoded = jwtDecode<DecodedToken>(this.accessToken)
      if (!decoded.exp) return null
      // exp is in seconds since epoch; convert to milliseconds for comparison with Date.now()
      return decoded.exp * 1000
    } catch {
      return null
    }
  }

  private isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry()
    if (!expiry) return true
    return expiry - 30000 < Date.now()
  }

  private isTokenNearingExpiry(): boolean {
    const expiry = this.getTokenExpiry()
    if (!expiry) return false

    // Check if token will expire in next 60 seconds
    return expiry - 60000 < Date.now()
  }

  private startExpiryCheck(): void {
    // Clear any existing interval
    this.stopExpiryCheck()

    // Check token expiry every 30 seconds
    this.tokenExpiryCheckInterval = setInterval(async () => {
      if (this.isTokenNearingExpiry() && this.tokenRefreshCallback) {
        try {
          const newToken = await this.tokenRefreshCallback()
          this.setAccessToken(newToken)
        } catch {
          this.clearAccessToken()
        }
      }
    }, 30000)
  }

  private stopExpiryCheck(): void {
    if (this.tokenExpiryCheckInterval) {
      clearInterval(this.tokenExpiryCheckInterval)
      this.tokenExpiryCheckInterval = null
    }
  }

  // Cleanup method to be called when the app unmounts
  destroy(): void {
    this.stopExpiryCheck()
    this.clearAccessToken()
  }
}

export const tokenManager = new TokenManager()
