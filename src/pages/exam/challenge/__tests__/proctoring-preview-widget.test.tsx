// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ProctoringPreviewWidget from '@/pages/exam/challenge/components/ProctoringPreviewWidget'

function createMockStream(): MediaStream {
  const track = {
    stop: vi.fn(),
    addEventListener: vi.fn(),
    getSettings: () => ({}),
  }
  return {
    getTracks: () => [track],
    getVideoTracks: () => [track],
    active: true,
  } as unknown as MediaStream
}

describe('ProctoringPreviewWidget', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows Camera active when camera is active and required', () => {
    render(
      <ProctoringPreviewWidget
        cameraActive={true}
        screenShareActive={false}
        fullscreenActive={false}
        cameraRequired={true}
        screenShareRequired={false}
        fullscreenRequired={false}
        cameraStream={null}
      />
    )

    expect(screen.getByText(/camera active/i)).toBeInTheDocument()
    expect(screen.queryByText(/camera inactive/i)).not.toBeInTheDocument()
  })

  it('shows Camera inactive when camera is required but not active', () => {
    render(
      <ProctoringPreviewWidget
        cameraActive={false}
        screenShareActive={false}
        fullscreenActive={false}
        cameraRequired={true}
        screenShareRequired={false}
        fullscreenRequired={false}
        cameraStream={null}
      />
    )

    expect(screen.getByText(/camera inactive/i)).toBeInTheDocument()
  })

  it('shows Screen sharing active when screen share is active and required', () => {
    render(
      <ProctoringPreviewWidget
        cameraActive={false}
        screenShareActive={true}
        fullscreenActive={false}
        cameraRequired={false}
        screenShareRequired={true}
        fullscreenRequired={false}
        cameraStream={null}
      />
    )

    expect(screen.getByText(/screen sharing active/i)).toBeInTheDocument()
  })

  it('shows Screen sharing inactive when screen share is required but not active', () => {
    render(
      <ProctoringPreviewWidget
        cameraActive={false}
        screenShareActive={false}
        fullscreenActive={false}
        cameraRequired={false}
        screenShareRequired={true}
        fullscreenRequired={false}
        cameraStream={null}
      />
    )

    expect(screen.getByText(/screen sharing inactive/i)).toBeInTheDocument()
  })

  it('shows Fullscreen active when fullscreen is active and required', () => {
    render(
      <ProctoringPreviewWidget
        cameraActive={false}
        screenShareActive={false}
        fullscreenActive={true}
        cameraRequired={false}
        screenShareRequired={false}
        fullscreenRequired={true}
        cameraStream={null}
      />
    )

    expect(screen.getByText(/fullscreen active/i)).toBeInTheDocument()
  })

  it('shows Fullscreen inactive when fullscreen is required but not active', () => {
    render(
      <ProctoringPreviewWidget
        cameraActive={false}
        screenShareActive={false}
        fullscreenActive={false}
        cameraRequired={false}
        screenShareRequired={false}
        fullscreenRequired={true}
        cameraStream={null}
      />
    )

    expect(screen.getByText(/fullscreen inactive/i)).toBeInTheDocument()
  })

  it('does not show status for capabilities that are not required', () => {
    render(
      <ProctoringPreviewWidget
        cameraActive={true}
        screenShareActive={true}
        fullscreenActive={true}
        cameraRequired={false}
        screenShareRequired={false}
        fullscreenRequired={false}
        cameraStream={null}
      />
    )

    expect(screen.queryByText(/camera/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/screen/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/fullscreen/i)).not.toBeInTheDocument()
  })

  it('has status role for accessibility', () => {
    render(
      <ProctoringPreviewWidget
        cameraActive={true}
        screenShareActive={true}
        fullscreenActive={true}
        cameraRequired={true}
        screenShareRequired={true}
        fullscreenRequired={true}
        cameraStream={null}
      />
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('does not display raw media data in text', () => {
    const { container } = render(
      <ProctoringPreviewWidget
        cameraActive={true}
        screenShareActive={true}
        fullscreenActive={true}
        cameraRequired={true}
        screenShareRequired={true}
        fullscreenRequired={true}
        cameraStream={null}
      />
    )

    expect(container.textContent).not.toContain('srcObject')
    expect(container.textContent).not.toContain('MediaStream')
    expect(container.textContent).not.toContain('base64')
  })

  it('renders video element when camera is active and stream is provided', () => {
    const stream = createMockStream()
    const { container } = render(
      <ProctoringPreviewWidget
        cameraActive={true}
        screenShareActive={false}
        fullscreenActive={false}
        cameraRequired={true}
        screenShareRequired={false}
        fullscreenRequired={false}
        cameraStream={stream}
      />
    )

    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    expect(video?.muted).toBe(true)
    expect(video?.autoplay).toBe(true)
  })

  it('does not render video element when camera is not required', () => {
    const { container } = render(
      <ProctoringPreviewWidget
        cameraActive={false}
        screenShareActive={false}
        fullscreenActive={false}
        cameraRequired={false}
        screenShareRequired={false}
        fullscreenRequired={false}
        cameraStream={null}
      />
    )

    const video = container.querySelector('video')
    expect(video).toBeNull()
  })

  it('has minimize button and can minimize/restore', async () => {
    const user = userEvent.setup()
    render(
      <ProctoringPreviewWidget
        cameraActive={true}
        screenShareActive={true}
        fullscreenActive={true}
        cameraRequired={true}
        screenShareRequired={true}
        fullscreenRequired={true}
        cameraStream={null}
      />
    )

    const minimizeButton = screen.getByRole('button', { name: /minimize/i })
    expect(minimizeButton).toBeInTheDocument()

    await user.click(minimizeButton)

    expect(screen.queryByText(/camera active/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /restore/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /restore/i }))

    expect(screen.getByText(/camera active/i)).toBeInTheDocument()
  })

  it('when minimized shows a small indicator', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <ProctoringPreviewWidget
        cameraActive={true}
        screenShareActive={false}
        fullscreenActive={false}
        cameraRequired={true}
        screenShareRequired={false}
        fullscreenRequired={false}
        cameraStream={null}
      />
    )

    await user.click(screen.getByRole('button', { name: /minimize/i }))

    const indicator = container.querySelector(
      '[data-testid="proctoring-minimized-indicator"]'
    )
    expect(indicator).not.toBeNull()
  })

  it('does not render when proctoring is not enabled (no required capabilities)', () => {
    const { container } = render(
      <ProctoringPreviewWidget
        cameraActive={false}
        screenShareActive={false}
        fullscreenActive={false}
        cameraRequired={false}
        screenShareRequired={false}
        fullscreenRequired={false}
        cameraStream={null}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('minimized indicator shows success when only required capabilities are active', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <ProctoringPreviewWidget
        cameraActive={true}
        screenShareActive={false}
        fullscreenActive={false}
        cameraRequired={true}
        screenShareRequired={false}
        fullscreenRequired={false}
        cameraStream={null}
      />
    )

    await user.click(screen.getByRole('button', { name: /minimize/i }))

    const indicator = container.querySelector(
      '[data-testid="proctoring-minimized-indicator"]'
    )
    expect(indicator).not.toBeNull()
    const dot = indicator?.querySelector('.inline-block')
    expect(dot).not.toBeNull()
    expect(dot?.getAttribute('style')).toContain('var(--exam-success)')
  })

  it('minimized indicator shows warning when required capability is inactive', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <ProctoringPreviewWidget
        cameraActive={false}
        screenShareActive={false}
        fullscreenActive={false}
        cameraRequired={true}
        screenShareRequired={false}
        fullscreenRequired={false}
        cameraStream={null}
      />
    )

    await user.click(screen.getByRole('button', { name: /minimize/i }))

    const indicator = container.querySelector(
      '[data-testid="proctoring-minimized-indicator"]'
    )
    expect(indicator).not.toBeNull()
    const dot = indicator?.querySelector('.inline-block')
    expect(dot).not.toBeNull()
    expect(dot?.getAttribute('style')).toContain('var(--exam-warning)')
  })
})
