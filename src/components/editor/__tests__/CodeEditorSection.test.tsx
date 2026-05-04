// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeContext } from '@/contexts/ThemeContextValue'

import CodeEditorSection from '../CodeEditorSection'

vi.mock('../MonacoEditorWrapper', () => ({
  default: (props: Record<string, unknown>) => (
    <div
      data-testid="mock-monaco"
      data-language={String(props.language ?? '')}
      data-theme={String(props.editorTheme ?? '')}
      data-font-size={String(props.fontSize ?? '')}
      data-line-height={String(props.lineHeight ?? '')}
      data-word-wrap={String(props.wordWrap ?? '')}
    />
  ),
}))

vi.mock('../ConsolePanel', () => ({
  default: () => <div data-testid="mock-console" />,
}))

const defaultProps = {
  code: '#include <vector>\nint main() { return 0; }',
  onCodeChange: vi.fn(),
  selectedLanguage: 'cpp',
  onLanguageChange: vi.fn(),
  testCases: [
    {
      id: 'tc-1',
      name: 'Case 1',
      input: '1',
      expectedOutput: '1',
    },
  ],
  selectedTestCase: 'tc-1',
  onTestCaseSelect: vi.fn(),
  output: {
    status: 'idle' as const,
    message: '',
  },
  onRun: vi.fn(),
  onSubmit: vi.fn(),
  onReset: vi.fn(),
}

function renderWithTheme() {
  return render(
    <ThemeContext.Provider
      value={{
        theme: 'dark',
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
      }}
    >
      <CodeEditorSection {...defaultProps} />
    </ThemeContext.Provider>
  )
}

describe('CodeEditorSection', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('passes readable default editor settings to Monaco', () => {
    renderWithTheme()

    expect(screen.getByTestId('mock-monaco')).toHaveAttribute(
      'data-font-size',
      '16'
    )
    expect(screen.getByTestId('mock-monaco')).toHaveAttribute(
      'data-word-wrap',
      'on'
    )
  })

  it('toggles word wrap and adjusts font size from the toolbar', () => {
    renderWithTheme()

    fireEvent.click(screen.getByRole('button', { name: 'Disable word wrap' }))
    expect(screen.getByTestId('mock-monaco')).toHaveAttribute(
      'data-word-wrap',
      'off'
    )

    fireEvent.click(screen.getByRole('button', { name: 'Increase font size' }))
    expect(screen.getByTestId('mock-monaco')).toHaveAttribute(
      'data-font-size',
      '17'
    )
  })

  it('opens and closes fullscreen editor mode from the toolbar', () => {
    renderWithTheme()

    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }))
    expect(
      screen.getByRole('dialog', { name: 'Code editor' })
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Exit fullscreen' }))
    expect(
      screen.queryByRole('dialog', { name: 'Code editor' })
    ).not.toBeInTheDocument()
  })
})
