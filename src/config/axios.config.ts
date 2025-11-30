import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios'
import { API_CONFIG } from './api.config'
import { tokenManager } from '../services/auth/token.service'

let refreshPromise: Promise<string> | null = null

async function refreshAccessTokenWithBackoff(): Promise<string> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const delays = [200, 500]
    for (let i = 0; i <= delays.length; i++) {
      try {
        const refreshResponse = await axios.post<{
          data?: { tokens?: { accessToken?: string }; accessToken?: string }
        }>(
          `${API_CONFIG.baseURL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        )

        const nested = refreshResponse.data?.data as
          | { tokens?: { accessToken?: string }; accessToken?: string }
          | undefined
        const accessToken =
          nested?.tokens?.accessToken ||
          nested?.accessToken ||
          (refreshResponse as unknown as { data: { accessToken?: string } })
            .data.accessToken

        if (!accessToken) {
          throw new Error('Access token not found in refresh response')
        }
        tokenManager.setAccessToken(accessToken)
        return accessToken
      } catch (err) {
        const anyErr = err as {
          response?: { status?: number; data?: { code?: string } }
        }
        const status = anyErr.response?.status
        const code = anyErr.response?.data?.code
        // do not retry on auth errors
        if (
          status === 401 ||
          code === 'NO_REFRESH_TOKEN' ||
          code === 'REFRESH_TOKEN_EXPIRED'
        ) {
          throw err
        }
        // retry only on network/5xx
        if (
          i < delays.length &&
          (!status || (status >= 500 && status <= 599))
        ) {
          await new Promise(r => setTimeout(r, delays[i]))
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
  private isRefreshing: boolean = false
  private failedQueue: Array<{
    resolve: (value?: unknown) => void
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

  private processQueue(
    error: unknown | null,
    token: string | null = null
  ): void {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error)
      } else {
        prom.resolve(token)
      }
    })
    this.failedQueue = []
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = tokenManager.getAccessToken()
        console.log('token', token)
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Don't set Content-Type for FormData - let browser set it automatically
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type']
        }

        return config
      },
      (error: AxiosError) => Promise.reject(error)
    )

    // Response interceptor
    this.instance.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean
          _retryCount?: number
        }

        // Suppress console errors for 401 on refresh-token (expected when not logged in)
        if (
          error.response?.status === 401 &&
          originalRequest.url?.includes('/auth/refresh-token')
        ) {
          // Silently handle 401 on refresh-token - this is expected when user is not logged in
          // Don't log to console to avoid noise
        }

        // Don't retry these paths
        const skipRetryPaths = [
          '/auth/login',
          '/auth/refresh-token',
          '/auth/logout',
        ]
        const shouldSkipRetry = skipRetryPaths.some(path =>
          originalRequest.url?.includes(path)
        )

        const statusIs401 = error.response?.status === 401
        // Prefer explicit backend code, but fall back to any 401
        const errorCode =
          (error.response as unknown as { data?: { code?: string } })?.data
            ?.code || (error as unknown as { code?: string }).code
        // Don't attempt refresh if refresh token is expired or missing
        // These errors mean the user must log in again
        const isRefreshTokenError =
          errorCode === 'NO_REFRESH_TOKEN' || errorCode === 'TOKEN_EXPIRED'

        const shouldAttemptRefresh =
          statusIs401 &&
          !isRefreshTokenError &&
          (errorCode === 'TOKEN_EXPIRED' || !errorCode)

        if (
          shouldAttemptRefresh &&
          !shouldSkipRetry &&
          (!originalRequest._retry || (originalRequest._retryCount || 0) < 1)
        ) {
          if (this.isRefreshing) {
            try {
              const token = await new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject })
              })

              if (originalRequest.headers && typeof token === 'string') {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              return this.instance(originalRequest)
            } catch (err) {
              return Promise.reject(err)
            }
          }

          originalRequest._retry = true
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
          this.isRefreshing = true

          try {
            // Single-flight refresh with light backoff when network/5xx
            const accessToken = await refreshAccessTokenWithBackoff()

            // Update authorization header
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`
            }

            // Process all queued requests
            this.processQueue(null, accessToken)

            // Retry original request
            return this.instance(originalRequest)
          } catch (refreshError) {
            this.processQueue(refreshError)

            // Clear tokens and trigger auth failure
            tokenManager.clearAccessToken()
            window.dispatchEvent(new CustomEvent('auth:failed'))

            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        // If error is not 401 or retry failed, reject with original error
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
