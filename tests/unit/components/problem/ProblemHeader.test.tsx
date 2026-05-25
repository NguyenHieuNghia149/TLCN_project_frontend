// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ProblemHeader from '@/components/problem/ProblemHeader'
import { ThemeContext } from '@/contexts/ThemeContextValue'

vi.mock('@/hooks/api/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
  }),
}))

function renderHeader(theme: 'dark' | 'light', toggleTheme = vi.fn()) {
  render(
    <MemoryRouter>
      <ThemeContext.Provider
        value={{
          theme,
          toggleTheme,
          setTheme: vi.fn(),
        }}
      >
        <ProblemHeader />
      </ThemeContext.Provider>
    </MemoryRouter>
  )

  return toggleTheme
}

describe('ProblemHeader theme control', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('switches the application from dark to light mode', () => {
    const toggleTheme = renderHeader('dark')

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to light mode' })
    )

    expect(toggleTheme).toHaveBeenCalledTimes(1)
  })

  it('labels the inverse action when light mode is active', () => {
    renderHeader('light')

    expect(
      screen.getByRole('button', { name: 'Switch to dark mode' })
    ).toBeInTheDocument()
  })
})
