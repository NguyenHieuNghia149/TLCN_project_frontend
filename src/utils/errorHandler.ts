/**
 * Error handling utilities for authentication
 */

export interface ApiError {
  message: string
  code?: string | number
  status?: number
  details?: Record<string, unknown>
}

export interface ErrorMapping {
  [key: string]: string
}

// Common error messages mapping
export const ERROR_MESSAGES: ErrorMapping = {
  // Network errors
  NETWORK_ERROR:
    'Unable to connect to server. Please check your network connection.',
  TIMEOUT: 'Request timeout. Please try again.',

  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_LOCKED: 'Account has been locked. Please contact administrator.',
  ACCOUNT_DISABLED: 'Account has been disabled.',
  EMAIL_NOT_VERIFIED: 'Email not verified. Please check your inbox.',
  TOO_MANY_ATTEMPTS: 'Too many login attempts. Please try again later.',

  // Server errors
  INTERNAL_SERVER_ERROR: 'Server error. Please try again later.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable.',

  // Validation errors
  VALIDATION_ERROR: 'Invalid data.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Invalid email format.',
  WEAK_PASSWORD: 'Password is too weak.',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  TOO_MANY_REQUESTS:
    'Too many requests from this IP. Please wait and try again later.',
  RATE_LIMIT: 'Request rate too fast. Please slow down and try again.',
}

/**
 * Extract error message from various error formats
 */
export const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object') {
    // Axios error format
    if ('response' in error) {
      const axiosError = error as {
        response: { data: { message?: string; error?: string } }
      }
      const message =
        axiosError.response?.data?.message || axiosError.response?.data?.error
      if (message) return message
    }

    // Generic object with message
    if (
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
    ) {
      return (error as { message: string }).message
    }

    // Generic object with error
    if (
      'error' in error &&
      typeof (error as { error: unknown }).error === 'string'
    ) {
      return (error as { error: string }).error
    }
  }

  return 'An unknown error occurred. Please try again.'
}

/**
 * Check if error is rate limit by HTTP status
 */
export const isRateLimitError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response: { status: number } }
    const status = axiosError.response?.status

    // Common rate limit status codes
    return status === 429 || status === 503 || status === 502
  }

  return false
}

/**
 * Get rate limit retry after time from headers
 */
export const getRateLimitRetryAfter = (error: unknown): number | null => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as {
      response: {
        headers: { 'retry-after'?: string }
      }
    }
    const retryAfter = axiosError.response?.headers?.['retry-after']
    if (retryAfter) {
      return parseInt(retryAfter, 10)
    }
  }

  return null
}

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  const message = extractErrorMessage(error)

  // Check for rate limit by HTTP status first
  if (isRateLimitError(error)) {
    const retryAfter = getRateLimitRetryAfter(error)
    if (retryAfter) {
      return `Too many requests. Please try again after ${retryAfter} seconds.`
    }
    return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
  }

  // Check if it's a known error code
  if (message in ERROR_MESSAGES) {
    return ERROR_MESSAGES[message]
  }

  // Check for common patterns
  if (message.toLowerCase().includes('network')) {
    return ERROR_MESSAGES.NETWORK_ERROR
  }

  if (message.toLowerCase().includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT
  }

  if (
    message.toLowerCase().includes('unauthorized') ||
    message.toLowerCase().includes('invalid credentials')
  ) {
    return ERROR_MESSAGES.INVALID_CREDENTIALS
  }

  if (message.toLowerCase().includes('locked')) {
    return ERROR_MESSAGES.ACCOUNT_LOCKED
  }

  if (message.toLowerCase().includes('disabled')) {
    return ERROR_MESSAGES.ACCOUNT_DISABLED
  }

  // Check for rate limiting patterns
  if (
    message.toLowerCase().includes('rate limit') ||
    message.toLowerCase().includes('too many requests') ||
    message.toLowerCase().includes('rate limit exceeded') ||
    message.toLowerCase().includes('quota exceeded')
  ) {
    return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED
  }

  if (message.toLowerCase().includes('too many requests')) {
    return ERROR_MESSAGES.TOO_MANY_REQUESTS
  }

  if (message.toLowerCase().includes('rate limit')) {
    return ERROR_MESSAGES.RATE_LIMIT
  }

  return message
}

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  const message = extractErrorMessage(error).toLowerCase()

  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('service unavailable') ||
    message.includes('internal server error')
  )
}

/**
 * Get error severity level
 */
export const getErrorSeverity = (error: unknown): 'low' | 'medium' | 'high' => {
  const message = extractErrorMessage(error).toLowerCase()

  if (message.includes('network') || message.includes('timeout')) {
    return 'low'
  }

  if (
    message.includes('invalid credentials') ||
    message.includes('validation')
  ) {
    return 'medium'
  }

  if (
    message.includes('locked') ||
    message.includes('disabled') ||
    message.includes('unauthorized')
  ) {
    return 'high'
  }

  return 'medium'
}
