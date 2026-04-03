// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SolutionCodeTabs from '@/components/problem/SolutionCodeTabs'

describe('SolutionCodeTabs', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    })
  })

  it('renders one tab per code variant and switches the visible code', () => {
    render(
      <SolutionCodeTabs
        codeVariants={[
          { language: 'cpp', sourceCode: 'cpp code' },
          { language: 'java', sourceCode: 'java code' },
          { language: 'python', sourceCode: 'python code' },
        ]}
        languageLabels={{ cpp: 'C++', java: 'Java', python: 'Python' }}
        preferredLanguage="java"
      />
    )

    expect(screen.getByRole('tab', { name: 'Java' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByText('java code')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Python' }))

    expect(screen.getByRole('tab', { name: 'Python' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByText('python code')).toBeInTheDocument()
  })

  it('copies the active code to clipboard', () => {
    render(
      <SolutionCodeTabs
        codeVariants={[
          { language: 'cpp', sourceCode: 'cpp code' },
          { language: 'java', sourceCode: 'java code' },
        ]}
        languageLabels={{ cpp: 'C++', java: 'Java' }}
        preferredLanguage="java"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Copy code' }))

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('java code')
  })

  it('opens an expanded code viewer when fullscreen is requested', () => {
    render(
      <SolutionCodeTabs
        codeVariants={[{ language: 'python', sourceCode: 'python code' }]}
        languageLabels={{ python: 'Python' }}
        preferredLanguage="python"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Expand code viewer' }))

    expect(
      screen.getByRole('dialog', { name: 'Solution code viewer' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Exit fullscreen' })
    ).toBeInTheDocument()
  })
})
