import { apiClient } from '../../config/axios.config'
import { tokenManager } from './token.service'
import axios from 'axios'
import { API_CONFIG } from '../../config/api.config'
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
    // Only log non-401 errors to avoid console spam when user is not logged in

    if (typeof error === 'object' && error !== null) {
      // Axios error with response
      if ('response' in error) {
        const axiosError = error as {
          response: {
            data: {
              message?: string
              error?: string
              code?: string
              errors?: Array<{ field: string; message: string }>
            }
            status: number
            statusText: string
          }
        }

        const { data, status, statusText } = axiosError.response
        const message = data?.message || data?.error || defaultMessage
        const code = data?.code || String(status)
        const fieldErrors = Array.isArray(data?.errors)
          ? data.errors
          : undefined

        throw new ApiError(
          message || `${status} ${statusText}`,
          code,
          fieldErrors
        )
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
      this.handleApiError(error, 'Login failed')
    }
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post('/auth/google', { idToken })
      const data = response.data?.data ?? {}
      const accessToken: string = data.tokens?.accessToken || data.accessToken
      const user: User = data.user
      console.log('accessToken', accessToken)
      if (!accessToken || !user) {
        throw new Error('Invalid login response')
      }
      tokenManager.setAccessToken(accessToken)
      return { accessToken, user }
    } catch (error) {
      this.handleApiError(error, 'Google login failed')
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
      this.handleApiError(error, (error as ApiError).message)
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {})
    } catch (error) {
      this.handleApiError(error, 'Logout failed')
    } finally {
      this.clearAllAuthData()
    }
  }

  async refreshToken(): Promise<{ accessToken: string }> {
    try {
      const silentAxios = axios.create({
        validateStatus: () => true, // Don't throw on any status code
      })

      const originalConsoleError = console.error
      // console.error = (...args: unknown[]) => {
      //   if (
      //     args[0] &&
      //     typeof args[0] === 'string' &&
      //     args[0].includes('refresh-token')
      //   ) {
      //     return
      //   }
      //   originalConsoleError.apply(console, args)
      // }

      const response = await silentAxios.post(
        `${API_CONFIG.baseURL}/auth/refresh-token`,
        {},
        {
          withCredentials: true,
        }
      )

      // Restore console.error
      console.error = originalConsoleError

      // Check for specific error codes from backend
      if (response.status === 401) {
        const errorCode =
          response.data?.code ||
          (response.data?.data as { code?: string })?.code
        const errorMessage = response.data?.message || 'Not authenticated'

        // Only logout if refresh token is explicitly expired or revoked
        // NO_REFRESH_TOKEN could mean cookie not sent (path mismatch) - don't logout
        if (
          errorCode === 'REFRESH_TOKEN_EXPIRED' ||
          errorCode === 'TOKEN_EXPIRED' ||
          errorMessage.includes('Refresh token expired') ||
          errorMessage.includes('expired') ||
          errorMessage.includes('revoked')
        ) {
          const tokenExpiredError = new Error(
            'Refresh token expired or revoked'
          )
          ;(tokenExpiredError as unknown as { code: string }).code =
            errorCode || 'REFRESH_TOKEN_EXPIRED'
          throw tokenExpiredError
        }

        // Generic 401 or NO_REFRESH_TOKEN - don't logout, just return error
        // This could be temporary (cookie not sent due to path mismatch)
        throw new Error('Not authenticated')
      }

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
      // Re-throw refresh token expired/revoked errors as-is
      if (
        error instanceof Error &&
        (error.message === 'Refresh token expired or revoked' ||
          (error as { code?: string }).code === 'REFRESH_TOKEN_EXPIRED' ||
          (error as { code?: string }).code === 'NO_REFRESH_TOKEN')
      ) {
        throw error
      }

      // 401 is expected when user is not logged in (no refresh token cookie)
      if (error instanceof Error && error.message === 'Not authenticated') {
        throw error
      }

      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as {
          response: { status: number; data?: { code?: string } }
        }
        if (axiosError.response?.status === 401) {
          const errorCode = axiosError.response?.data?.code
          if (
            errorCode === 'NO_REFRESH_TOKEN' ||
            errorCode === 'REFRESH_TOKEN_EXPIRED'
          ) {
            const refreshTokenError = new Error(
              'Refresh token expired or revoked'
            )
            ;(refreshTokenError as unknown as { code: string }).code = errorCode
            throw refreshTokenError
          }
          throw new Error('Not authenticated')
        }
      }

      // For other errors, still log and handle normally
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
      this.handleApiError(error, 'Forget password failed')
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const res = await apiClient.get('/auth/me')

      return res.data.data
    } catch (error) {
      this.handleApiError(error, 'Get current user failed')
    }
  }
  /**
   * Clear all authentication data (memory only)
   */
  clearAllAuthData(): void {
    tokenManager.clearAccessToken()
  }
}
export class ApiError extends Error {
  code: string
  fieldErrors?: Array<{ field: string; message: string }>

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    fieldErrors?: Array<{ field: string; message: string }>
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.fieldErrors = fieldErrors
  }

  /**
   * Get error message for a specific field
   */
  getFieldError(fieldName: string): string | undefined {
    return this.fieldErrors?.find(e => e.field === fieldName)?.message
  }

  /**
   * Check if error has field-specific errors
   */
  hasFieldErrors(): boolean {
    return !!this.fieldErrors && this.fieldErrors.length > 0
  }
}

export const authService = new AuthService()
