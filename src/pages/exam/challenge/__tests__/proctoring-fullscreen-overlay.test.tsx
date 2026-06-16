// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ProctoringFullscreenOverlay from '@/pages/exam/challenge/components/ProctoringFullscreenOverlay'

describe('ProctoringFullscreenOverlay', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders fullscreen required message', () => {
    render(<ProctoringFullscreenOverlay onRequestFullscreen={vi.fn()} />)

    expect(
      screen.getByText(/fullscreen is required for this proctored exam/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /return to fullscreen/i })
    ).toBeInTheDocument()
  })

  it('calls onRequestFullscreen when button is clicked', async () => {
    const user = userEvent.setup()
    const onRequestFullscreen = vi.fn()

    render(
      <ProctoringFullscreenOverlay onRequestFullscreen={onRequestFullscreen} />
    )

    await user.click(
      screen.getByRole('button', { name: /return to fullscreen/i })
    )

    expect(onRequestFullscreen).toHaveBeenCalledTimes(1)
  })

  it('has alertdialog role for accessibility', () => {
    render(<ProctoringFullscreenOverlay onRequestFullscreen={vi.fn()} />)

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })
})
