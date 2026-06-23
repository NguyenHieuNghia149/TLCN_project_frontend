import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios'

import {
  API_CONFIG,
  extractErrorCode,
  isTerminalRefreshErrorCode,
} from './api.config'

let refreshPromise: Promise<void> | null = null
let csrfTokenValue: string | null = null

export function setCsrfTokenValue(value: string): void {
  csrfTokenValue = value
}

const CSRF_COOKIE_NAME = 'csrfToken'
const CSRF_HEADER_NAME = 'X-CSRF-Token'
const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])
const PUBLIC_AUTH_BOOTSTRAP_RETRY_SKIP_PATHS = new Set([
  '/auth/register',
  '/auth/login',
  '/auth/google',
  '/auth/refresh-token',
  '/auth/logout',
  '/auth/send-verification-email',
  '/auth/send-reset-otp',
  '/auth/verify-otp',
  '/auth/reset-password',
])

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined' || typeof document.cookie !== 'string') {
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

function attachCsrfHeader(
  headers: InternalAxiosRequestConfig['headers'],
  method?: string
): void {
  if (!method || !MUTATING_METHODS.has(method.toLowerCase())) {
    return
  }

  const csrfToken = csrfTokenValue ?? readCookie(CSRF_COOKIE_NAME)
  if (!csrfToken) {
    return
  }

  if (
    typeof (headers as { set?: (name: string, value: string) => void }).set ===
    'function'
  ) {
    ;(headers as { set: (name: string, value: string) => void }).set(
      CSRF_HEADER_NAME,
      csrfToken
    )
    return
  }

  ;(headers as Record<string, string>)[CSRF_HEADER_NAME] = csrfToken
}

function shouldSkipRefreshRetry(url?: string): boolean {
  if (!url) {
    return false
  }

  return Array.from(PUBLIC_AUTH_BOOTSTRAP_RETRY_SKIP_PATHS).some(path =>
    url.includes(path)
  )
}

async function refreshSessionWithBackoff(): Promise<void> {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const delays = [200, 500]

    for (let i = 0; i <= delays.length; i++) {
      try {
        const csrfToken = csrfTokenValue ?? readCookie(CSRF_COOKIE_NAME)
        const res = await axios.post(
          `${API_CONFIG.baseURL}/auth/refresh-token`,
          {},
          {
            withCredentials: true,
            headers: csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : undefined,
          }
        )

        const bodyCsrf = res.data?.csrfToken
        if (typeof bodyCsrf === 'string' && bodyCsrf.length > 0) {
          csrfTokenValue = bodyCsrf
        }

        return
      } catch (err) {
        const code = extractErrorCode(err)

        if (code === '401' || isTerminalRefreshErrorCode(code)) {
          throw err
        }

        const status =
          typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          typeof (err as { response?: { status?: unknown } }).response
            ?.status === 'number'
            ? (err as { response?: { status?: number } }).response?.status
            : undefined

        if (
          i < delays.length &&
          (!status || (status >= 500 && status <= 599))
        ) {
          await new Promise(resolve => setTimeout(resolve, delays[i]))
          continue
        }

        throw err
      }
    }

    throw new Error('Unexpected refresh flow termination')
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

class AxiosInstanceManager {
  private instance: AxiosInstance
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: () => void
    reject: (error: unknown) => void
  }> = []

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      withCredentials: API_CONFIG.withCredentials,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private processQueue(error: unknown | null): void {
    this.failedQueue.forEach(pendingRequest => {
      if (error) {
        pendingRequest.reject(error)
        return
      }

      pendingRequest.resolve()
    })
    this.failedQueue = []
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type']
        }

        attachCsrfHeader(config.headers, config.method)

        return config
      },
      (error: AxiosError) => Promise.reject(error)
    )

    this.instance.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean
          _retryCount?: number
        }

        const shouldSkipRetry = shouldSkipRefreshRetry(originalRequest.url)

        const statusIs401 = error.response?.status === 401
        const errorCode = extractErrorCode(error)
        const shouldAttemptRefresh =
          statusIs401 && !isTerminalRefreshErrorCode(errorCode)

        if (
          shouldAttemptRefresh &&
          !shouldSkipRetry &&
          (!originalRequest._retry || (originalRequest._retryCount || 0) < 1)
        ) {
          if (this.isRefreshing) {
            try {
              await new Promise<void>((resolve, reject) => {
                this.failedQueue.push({ resolve, reject })
              })
              return this.instance(originalRequest)
            } catch (err) {
              return Promise.reject(err)
            }
          }

          originalRequest._retry = true
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
          this.isRefreshing = true

          try {
            await refreshSessionWithBackoff()
            this.processQueue(null)
            return this.instance(originalRequest)
          } catch (refreshError) {
            this.processQueue(refreshError)
            window.dispatchEvent(new CustomEvent('auth:failed'))
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        return Promise.reject(error)
      }
    )
  }

  getAxios(): AxiosInstance {
    return this.instance
  }
}

const axiosManager = new AxiosInstanceManager()
export const apiClient = axiosManager.getAxios()
