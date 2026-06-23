import axios from 'axios'
import { apiClient } from '@/config/axios.config'
import {
  API_CONFIG,
  extractErrorCode,
  isTerminalRefreshError,
  isTerminalRefreshErrorCode,
} from '@/config/api.config'
import { LoginCredentials, RegisterData, User } from '../../types/auth.types'

type AuthUserPayload = {
  user: User
}

const CSRF_COOKIE_NAME = 'csrfToken'
const CSRF_HEADER_NAME = 'X-CSRF-Token'

export class AuthService {
  private readCookie(name: string): string | undefined {
    if (
      typeof document === 'undefined' ||
      typeof document.cookie !== 'string'
    ) {
      return undefined
    }

    const cookiePrefix = `${name}=`
    const cookieEntry = document.cookie
      .split(';')
      .map(part => part.trim())
      .find(part => part.startsWith(cookiePrefix))

    if (!cookieEntry) {
      return undefined
    }

    const rawValue = cookieEntry.slice(cookiePrefix.length)
    return rawValue ? decodeURIComponent(rawValue) : undefined
  }

  private isCodeLikeMessage(value: string | undefined): boolean {
    return !!value && /^[A-Z0-9_]+$/.test(value.trim())
  }

  private handleApiError(error: unknown, defaultMessage: string): never {
    if (typeof error === 'object' && error !== null) {
      if ('response' in error) {
        const axiosError = error as {
          response: {
            data: {
              message?: string
              error?:
                | string
                | {
                    message?: string
                    code?: string
                    details?: unknown
                  }
              code?: string
              errors?: Array<{ field: string; message: string }>
              data?: {
                message?: string
                code?: string
              }
            }
            status: number
            statusText: string
          }
        }

        const { data, status, statusText } = axiosError.response
        const nestedErrorMessage =
          typeof data?.error === 'object' ? data.error?.message : undefined
        const topLevelMessage = data?.message
        const message =
          (this.isCodeLikeMessage(topLevelMessage) && nestedErrorMessage
            ? nestedErrorMessage
            : undefined) ||
          topLevelMessage ||
          nestedErrorMessage ||
          data?.data?.message ||
          (typeof data?.error === 'string' ? data.error : undefined) ||
          defaultMessage
        const code =
          data?.code ||
          (typeof data?.error === 'object' && data?.error?.code) ||
          data?.data?.code ||
          String(status)
        const rawErrors = Array.isArray(data?.errors)
          ? data.errors
          : typeof data?.error === 'object' &&
              Array.isArray(data?.error?.details)
            ? data.error.details
            : undefined

        throw new ApiError(
          message || `${status} ${statusText}`,
          code,
          rawErrors
        )
      }

      if ('request' in error) {
        throw new Error(
          'Unable to connect to server. Please check your network connection.'
        )
      }

      if (
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string'
      ) {
        throw new Error((error as { message: string }).message)
      }
    }

    if (error instanceof Error) {
      throw new Error(error.message)
    }

    throw new Error(defaultMessage)
  }

  private extractUserPayload(data: unknown): User | null {
    if (!data || typeof data !== 'object') {
      return null
    }

    const payload = data as {
      data?: {
        user?: User
        data?:
          | {
              user?: User
            }
          | User
      }
      user?: User
    }

    const nestedData = payload.data?.data
    const nestedUser =
      nestedData && typeof nestedData === 'object' && 'user' in nestedData
        ? (nestedData as { user?: User }).user
        : undefined

    return payload.data?.user || nestedUser || payload.user || null
  }

  async login(credentials: LoginCredentials): Promise<AuthUserPayload> {
    try {
      const response = await apiClient.post('/auth/login', credentials)
      const user = this.extractUserPayload(response.data)

      if (!user) {
        throw new Error('Invalid login response')
      }

      return { user }
    } catch (error) {
      this.handleApiError(error, 'Login failed')
    }
  }

  async loginWithGoogle(idToken: string): Promise<AuthUserPayload> {
    try {
      const response = await apiClient.post('/auth/google', { idToken })
      const user = this.extractUserPayload(response.data)

      if (!user) {
        throw new Error('Invalid login response')
      }

      return { user }
    } catch (error) {
      this.handleApiError(error, 'Google login failed')
    }
  }

  async register(data: RegisterData): Promise<unknown> {
    try {
      const response = await apiClient.post('/auth/register', data)
      return response.data
    } catch (error) {
      this.handleApiError(error, 'Registration failed')
    }
  }

  async requestRegisterOtp(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/send-verification-email', { email })
    } catch (error) {
      this.handleApiError(error, 'Failed to send verification email')
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {})
    } catch (error) {
      this.handleApiError(error, 'Logout failed')
    }
  }

  async refreshToken(): Promise<User> {
    try {
      const silentAxios = axios.create({
        validateStatus: () => true,
      })

      const response = await silentAxios.post(
        `${API_CONFIG.baseURL}/auth/refresh-token`,
        {},
        {
          withCredentials: true,
          headers: (() => {
            const csrfToken = this.readCookie(CSRF_COOKIE_NAME)

            if (!csrfToken) {
              return undefined
            }

            return {
              [CSRF_HEADER_NAME]: csrfToken,
            }
          })(),
        }
      )

      if (response.status === 401) {
        const errorCode = extractErrorCode({
          response: {
            status: response.status,
            data: response.data,
          },
        })
        const errorMessage = response.data?.message || 'Not authenticated'

        if (
          isTerminalRefreshErrorCode(errorCode) ||
          errorMessage.includes('Refresh token expired') ||
          errorMessage.includes('expired') ||
          errorMessage.includes('revoked')
        ) {
          const refreshTokenError = new Error(
            'Refresh token expired or revoked'
          )
          ;(refreshTokenError as { code?: string }).code =
            errorCode || 'REFRESH_TOKEN_EXPIRED'
          throw refreshTokenError
        }

        const authError = new Error('Not authenticated')
        if (errorCode) {
          ;(authError as { code?: string }).code = errorCode
        }
        throw authError
      }

      const user = this.extractUserPayload(response.data)

      if (!user) {
        throw new Error('Invalid refresh response')
      }

      return user
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === 'Not authenticated' || isTerminalRefreshError(error))
      ) {
        throw error
      }

      if (typeof error === 'object' && error !== null && 'response' in error) {
        const code = extractErrorCode(error)
        if (code === '401') {
          if (isTerminalRefreshErrorCode(extractErrorCode(error))) {
            const refreshTokenError = new Error(
              'Refresh token expired or revoked'
            )
            ;(refreshTokenError as { code?: string }).code =
              extractErrorCode(error)
            throw refreshTokenError
          }
          throw new Error('Not authenticated')
        }
      }

      this.handleApiError(error, 'Token refresh failed')
    }
  }

  async sendResetOtp(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/send-reset-otp', { email })
    } catch (error) {
      this.handleApiError(error, 'Failed to send OTP')
    }
  }

  async verifyOtp(email: string, otp: string): Promise<void> {
    try {
      await apiClient.post('/auth/verify-otp', { email, otp })
    } catch (error) {
      this.handleApiError(error, 'Invalid OTP')
    }
  }

  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
      })
    } catch (error) {
      this.handleApiError(error, 'Failed to reset password')
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get('/auth/me')
      const user = this.extractUserPayload(response.data) || response.data?.data

      if (!user) {
        throw new Error('Invalid current user response')
      }

      return user
    } catch (error) {
      this.handleApiError(error, 'Get current user failed')
    }
  }

  clearAllAuthData(): void {
    // Intentionally empty. Browser auth state is cookie-backed.
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

  getFieldError(fieldName: string): string | undefined {
    return this.fieldErrors?.find(e => e.field === fieldName)?.message
  }

  hasFieldErrors(): boolean {
    return !!this.fieldErrors && this.fieldErrors.length > 0
  }
}

export const authService = new AuthService()
