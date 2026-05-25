// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import CodeEditorSection from '@/components/editor/CodeEditorSection'
import { ThemeContext } from '@/contexts/ThemeContextValue'

vi.mock('@/components/editor/MonacoEditorWrapper', () => ({
  default: (props: Record<string, unknown>) => (
    <div
      data-testid="mock-monaco"
      data-theme={String(props.editorTheme ?? '')}
    />
  ),
}))

vi.mock('@/components/editor/ConsolePanel', () => ({
  default: () => <div data-testid="mock-console" />,
}))

const defaultProps = {
  code: 'int main() { return 0; }',
  onCodeChange: vi.fn(),
  selectedLanguage: 'cpp',
  onLanguageChange: vi.fn(),
  testCases: [],
  selectedTestCase: '',
  onTestCaseSelect: vi.fn(),
  output: {
    status: 'idle' as const,
    message: '',
  },
  onRun: vi.fn(),
  onSubmit: vi.fn(),
  onReset: vi.fn(),
}

function renderWithTheme(theme: 'dark' | 'light') {
  return render(
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
      }}
    >
      <CodeEditorSection {...defaultProps} />
    </ThemeContext.Provider>
  )
}

describe('CodeEditorSection theme control', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('uses the application theme without rendering an editor-only toggle', () => {
    const { rerender } = renderWithTheme('dark')

    expect(
      screen.queryByRole('button', { name: 'Toggle editor theme' })
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('mock-monaco')).toHaveAttribute(
      'data-theme',
      'custom-dark'
    )

    rerender(
      <ThemeContext.Provider
        value={{
          theme: 'light',
          toggleTheme: vi.fn(),
          setTheme: vi.fn(),
        }}
      >
        <CodeEditorSection {...defaultProps} />
      </ThemeContext.Provider>
    )

    expect(screen.getByTestId('mock-monaco')).toHaveAttribute(
      'data-theme',
      'custom-light'
    )
  })
})
