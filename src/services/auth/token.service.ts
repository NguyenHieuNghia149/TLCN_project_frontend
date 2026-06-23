class TokenManager {
  setAccessToken(): void {}

  getAccessToken(): string | null {
    return null
  }

  clearAccessToken(): void {}

  setTokenRefreshCallback(): void {}

  destroy(): void {}
}

export const tokenManager = new TokenManager()
