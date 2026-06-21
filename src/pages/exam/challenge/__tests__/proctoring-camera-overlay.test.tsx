// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import ProctoringCameraOverlay from '@/pages/exam/challenge/components/ProctoringCameraOverlay'

describe('ProctoringCameraOverlay', () => {
  it('asks the candidate to enable camera and calls the permission handler', async () => {
    const user = userEvent.setup()
    const onRequestCamera = vi.fn().mockResolvedValue(true)

    render(<ProctoringCameraOverlay onRequestCamera={onRequestCamera} />)

    expect(
      screen.getByText(/camera access is required for this proctored exam/i)
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /turn on camera/i }))

    expect(onRequestCamera).toHaveBeenCalledTimes(1)
  })
})
