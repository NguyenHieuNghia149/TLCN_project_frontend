export const API_CONFIG = {
  baseURL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.REACT_APP_API_URL ||
    'http://localhost:3001/api',
  timeout: 10000,
  withCredentials: true,
} as const

const TERMINAL_REFRESH_ERROR_CODES = new Set([
  'REFRESH_TOKEN_EXPIRED',
  'REFRESH_TOKEN_NOT_FOUND',
  'NO_REFRESH_TOKEN',
  'TOKEN_EXPIRED',
])

const AUTH_RECOVERY_ERROR_CODES = new Set([
  '401',
  'AUTHENTICATION_ERROR',
  'UNAUTHORIZED',
])

export function extractErrorCode(error: unknown): string | undefined {
  if (error instanceof Error) {
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string' && code.trim()) {
      return code
    }
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            code?: unknown
            error?: { code?: unknown }
          }
          status?: unknown
        }
      }
    ).response

    const code = response?.data?.code
    if (typeof code === 'string' && code.trim()) {
      return code
    }

    const nestedCode = response?.data?.error?.code
    if (typeof nestedCode === 'string' && nestedCode.trim()) {
      return nestedCode
    }

    if (typeof response?.status === 'number') {
      return String(response.status)
    }
  }

  return undefined
}

export function isTerminalRefreshErrorCode(code: string | undefined): boolean {
  return !!code && TERMINAL_REFRESH_ERROR_CODES.has(code)
}

export function isTerminalRefreshError(error: unknown): boolean {
  if (
    error instanceof Error &&
    error.message === 'Refresh token expired or revoked'
  ) {
    return true
  }

  return isTerminalRefreshErrorCode(extractErrorCode(error))
}

export function isAuthenticationRecoveryCandidate(error: unknown): boolean {
  if (error instanceof Error && error.message === 'Not authenticated') {
    return true
  }

  const code = extractErrorCode(error)
  return !!code && AUTH_RECOVERY_ERROR_CODES.has(code)
}
