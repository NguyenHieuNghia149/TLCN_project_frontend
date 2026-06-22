// @vitest-environment jsdom

import React, { StrictMode } from 'react'
import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const initAction = { type: 'auth/initializeSession/pending' }
  const logoutAction = { type: 'auth/logout/pending' }

  return {
    dispatch: vi.fn(),
    initAction,
    initializeSession: vi.fn(() => initAction),
    logoutUser: vi.fn(() => logoutAction),
  }
})

vi.mock('react-redux', () => ({
  useDispatch: () => mocks.dispatch,
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      auth: {
        session: {
          isLoading: false,
        },
      },
    }),
}))

vi.mock('../store/slices/authSlice', () => ({
  initializeSession: mocks.initializeSession,
  logoutUser: mocks.logoutUser,
}))

vi.mock('../routes', () => ({
  default: {},
}))

vi.mock('react-router-dom', () => ({
  RouterProvider: () => <div data-testid="router-provider" />,
}))

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
}))

vi.mock('antd', () => ({
  ConfigProvider: ({ children }: { children: React.ReactNode }) => children,
  App: ({ children }: { children: React.ReactNode }) => children,
  theme: {
    darkAlgorithm: 'dark',
    defaultAlgorithm: 'light',
  },
  Spin: () => <div data-testid="spin" />,
}))

vi.mock('@/contexts/useTheme', () => ({
  useTheme: () => ({ theme: 'light' }),
}))

describe('App boot session initialization', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.dispatch.mockReturnValue(Promise.resolve(undefined))
  })

  afterEach(() => {
    cleanup()
  })

  it('dispatches initializeSession only once under StrictMode remounts', async () => {
    const { default: App } = await import('../App')

    render(
      <StrictMode>
        <App />
      </StrictMode>
    )

    expect(mocks.initializeSession).toHaveBeenCalledTimes(1)
    expect(mocks.dispatch).toHaveBeenCalledWith(mocks.initAction)
  })

  it('allows a later remount to initialize session again after the first boot completes', async () => {
    const { default: App } = await import('../App')

    const firstRender = render(<App />)
    await Promise.resolve()
    firstRender.unmount()

    render(<App />)

    expect(mocks.initializeSession).toHaveBeenCalledTimes(2)
  })
})
