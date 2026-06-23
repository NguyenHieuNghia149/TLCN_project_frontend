// @vitest-environment jsdom

import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

import axios from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originalAxiosPost = axios.post.bind(axios)

function setCookie(cookie: string): void {
  document.cookie = cookie
}

function getRequestInterceptor() {
  return (
    apiClient.interceptors.request as unknown as {
      handlers: Array<{
        fulfilled: (
          config: InternalAxiosRequestConfig
        ) => InternalAxiosRequestConfig
      }>
    }
  ).handlers[0].fulfilled
}

function getResponseInterceptor() {
  return (
    apiClient.interceptors.response as unknown as {
      handlers: Array<{
        rejected: (error: AxiosError) => Promise<unknown>
      }>
    }
  ).handlers[0].rejected
}

function createRequestConfig(
  method: string,
  url = '/roadmaps'
): InternalAxiosRequestConfig {
  return {
    url,
    method,
    headers: {},
  } as InternalAxiosRequestConfig
}

function createAxiosError(
  status: number,
  config: InternalAxiosRequestConfig
): AxiosError {
  return {
    config,
    isAxiosError: true,
    name: 'AxiosError',
    message: `Request failed with status code ${status}`,
    toJSON: () => ({}),
    response: {
      status,
      statusText: String(status),
      headers: {},
      config,
      data: {},
    },
  } as AxiosError
}

const { apiClient } = await import('../axios.config')

describe('axios cookie-auth config', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    document.cookie = ''
  })

  afterEach(() => {
    ;(axios as unknown as { post: typeof axios.post }).post = originalAxiosPost
    document.cookie =
      'csrfToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  })

  it('keeps withCredentials enabled on the shared axios instance', () => {
    expect(apiClient.defaults.withCredentials).toBe(true)
  })

  it('attaches X-CSRF-Token for mutating requests from the readable cookie', () => {
    setCookie('csrfToken=csrf-token')
    const intercept = getRequestInterceptor()
    const config = createRequestConfig('post')

    const nextConfig = intercept(config)

    expect(nextConfig.headers['X-CSRF-Token']).toBe('csrf-token')
  })

  it('does not attach X-CSRF-Token for safe GET requests', () => {
    setCookie('csrfToken=csrf-token')
    const intercept = getRequestInterceptor()
    const config = createRequestConfig('get')

    const nextConfig = intercept(config)

    expect(nextConfig.headers['X-CSRF-Token']).toBeUndefined()
  })

  it('does not trigger refresh retry behavior for 403 CSRF failures', async () => {
    const refreshPostMock = vi.fn().mockResolvedValue({ data: {} })
    ;(axios as unknown as { post: typeof refreshPostMock }).post =
      refreshPostMock
    const reject = getResponseInterceptor()
    const config = createRequestConfig('post', '/roadmaps')

    await expect(reject(createAxiosError(403, config))).rejects.toMatchObject({
      response: {
        status: 403,
      },
    })
    expect(refreshPostMock).not.toHaveBeenCalled()
  })

  it('does not trigger refresh retry behavior for 401s from public auth/bootstrap endpoints', async () => {
    const refreshPostMock = vi.fn().mockResolvedValue({ data: {} })
    ;(axios as unknown as { post: typeof refreshPostMock }).post =
      refreshPostMock
    const reject = getResponseInterceptor()
    const config = createRequestConfig('post', '/auth/register')

    await expect(reject(createAxiosError(401, config))).rejects.toMatchObject({
      response: {
        status: 401,
      },
    })
    expect(refreshPostMock).not.toHaveBeenCalled()
  })
})
