import { apiClient } from '../../config/axios.config'
import { tokenManager } from '../../services/auth/token.service'
// No persistent storage of access token; refresh cookie handled by server
import {
  LoginCredentials,
  AuthResponse,
  User,
  RegisterData,
} from '../../types/auth.types'

export class AuthService {
  constructor() {
    // Set up token auto-refresh callback (access token only)
    tokenManager.setTokenRefreshCallback(async () => {
      const { accessToken } = await this.refreshToken()
      return accessToken
    })
  }

  private handleApiError(error: unknown, defaultMessage: string): never {
    console.error('API Error details:', error)

    if (typeof error === 'object' && error !== null) {
      // Axios error with response
      if ('response' in error) {
        const axiosError = error as {
          response: {
            data: { message?: string; error?: string }
            status: number
            statusText: string
          }
        }
        const message =
          axiosError.response.data.message || axiosError.response.data.error
        const status = axiosError.response.status
        const statusText = axiosError.response.statusText

        // Removed rate limit specific handling (429/503)

        throw new Error(message || `${status} ${statusText}` || defaultMessage)
      }
      // Axios error without response (network error)
      else if ('request' in error) {
        throw new Error(
          'Unable to connect to server. Please check your network connection.'
        )
      }
      // Generic object with message
      else if (
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
      ) {
        throw new Error((error as { message: string }).message)
      }
    }

    // Error instance
    if (error instanceof Error) {
      throw new Error(error.message)
    }

    // Unknown error
    throw new Error(defaultMessage)
  }

  async login(
    credentials: LoginCredentials
  ): Promise<{ accessToken: string; user: User }> {
    try {
      const response = await apiClient.post('/auth/login', credentials)

      // Expect backend to set httpOnly refresh cookie and return tokens + user
      const data = response.data?.data ?? {}
      const accessToken: string = data.tokens?.accessToken || data.accessToken
      const user: User = data.user

      if (!accessToken || !user) {
        throw new Error('Invalid login response')
      }

      // Store access token in memory only
      tokenManager.setAccessToken(accessToken)

      return { accessToken, user }
    } catch (error) {
      console.error('Login error details:', error)
      this.handleApiError(error, 'Login failed')
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        '/auth/register',
        data
      )
      return response.data
    } catch (error) {
      this.handleApiError(error, 'Registration failed')
    }
  }

  async requestRegisterOtp(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/send-verification-email', { email })
    } catch (error) {
      this.handleApiError(error, 'Failed to send OTP')
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {})
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearAllAuthData()
    }
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    try {
      const response = await apiClient.post('/auth/refresh-token', {})
      const nested = response.data?.data
      const accessToken: string =
        nested?.tokens?.accessToken ||
        nested?.accessToken ||
        response.data?.accessToken

      if (!accessToken) {
        throw new Error('Access token not found in refresh response')
      }

      tokenManager.setAccessToken(accessToken)

      return { accessToken }
    } catch (error) {
      console.error('Refresh token error:', error)
      this.handleApiError(error, 'Token refresh failed')
    }
  }

  async forgetPassword(
    email: string,
    opt: string,
    newPassword: string
  ): Promise<void> {
    try {
      const res = await apiClient.post('/auth/forget-password', {
        email,
        opt,
        newPassword,
      })
      return res.data
    } catch (error) {
      console.error('Forget password error:', error)
      throw new Error('Forget password failed')
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const res = await apiClient.get('/auth/me')

      return res.data.data
    } catch (error) {
      console.error('Get current user error:', error)
      throw new Error('Get current user failed')
    }
  }
  /**
   * Clear all authentication data (memory only)
   */
  clearAllAuthData(): void {
    tokenManager.clearAccessToken()
  }
}

export const authService = new AuthService()
