import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  exp: number
  sub?: string
  iat?: number
  [key: string]: string | number | undefined
}

class TokenManager {
  private accessToken: string | null = null
  private tokenExpiryCheckInterval: NodeJS.Timeout | null = null
  private tokenRefreshCallback: (() => Promise<string>) | null = null

  constructor() {
    this.startExpiryCheck()
  }

  setAccessToken(token: string | null): void {
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
      return decoded.exp // Convert to milliseconds
    } catch {
      return null
    }
  }

  private isTokenExpired(): boolean {
    const expiry = this.getTokenExpiry()
    if (!expiry) return true

    // Consider token expired 30 seconds before actual expiry
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
