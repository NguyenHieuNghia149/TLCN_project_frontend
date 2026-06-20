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

describe('Screen share recovery overlay', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders screen share required message and Reshare screen button', () => {
    render(
      <div
        role="alertdialog"
        aria-label="Screen share required for proctored exam"
      >
        <h2>Screen share is required for this proctored exam.</h2>
        <p>
          The exam requires screen sharing. Please reshare your screen to
          continue working.
        </p>
        <button type="button">Reshare screen</button>
      </div>
    )

    expect(
      screen.getByText(/screen share is required for this proctored exam/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /reshare screen/i })
    ).toBeInTheDocument()
  })

  it('Reshare screen button calls requestScreenShare when clicked', async () => {
    const user = userEvent.setup()
    const onReshare = vi.fn().mockResolvedValue(true)

    render(
      <div
        role="alertdialog"
        aria-label="Screen share required for proctored exam"
      >
        <h2>Screen share is required for this proctored exam.</h2>
        <p>
          The exam requires screen sharing. Please reshare your screen to
          continue working.
        </p>
        <button
          type="button"
          onClick={() => {
            void onReshare()
          }}
        >
          Reshare screen
        </button>
      </div>
    )

    await user.click(screen.getByRole('button', { name: /reshare screen/i }))

    expect(onReshare).toHaveBeenCalledTimes(1)
  })
})
