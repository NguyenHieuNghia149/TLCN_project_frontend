import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  exp: number
  sub?: string
  iat?: number
  [key: string]: string | number | undefined
}

// ❌ No storage key needed - pure in-memory storage

class TokenManager {
  private accessToken: string | null = null
  private tokenExpiryCheckInterval: NodeJS.Timeout | null = null
  private tokenRefreshCallback: (() => Promise<string>) | null = null

  // ✅ No sessionStorage hydration
  // Access token will be fetched fresh via refresh token on every page load
  constructor() {
    // Removed hydrateFromSessionStorage() - pure in-memory storage
  }

  setAccessToken(token: string | null): void {
    // ✅ Store ONLY in memory (RAM)
    // ❌ Do NOT persist to sessionStorage or localStorage - security risk
    this.accessToken = token

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
    // ✅ Clear in-memory token only
    this.accessToken = null
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
