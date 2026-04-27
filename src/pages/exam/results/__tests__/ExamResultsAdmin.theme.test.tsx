// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminThemeContext } from '@/contexts/AdminThemeContextDef'
import ExamResultsAdmin from '@/pages/exam/results/ExamResultsAdmin'
import { examService } from '@/services/api/exam.service'

vi.mock('@/services/api/exam.service', () => ({
  examService: {
    getAdminExamById: vi.fn(),
    getLeaderboard: vi.fn(),
    getSubmissionDetails: vi.fn(),
  },
}))

describe('ExamResultsAdmin theme', () => {
  beforeEach(() => {
    vi.mocked(examService.getAdminExamById).mockResolvedValue({
      id: 'exam-1',
      slug: 'spring-midterm',
      title: 'Spring Midterm',
      duration: 60,
      startDate: '2026-05-01T09:00:00.000Z',
      endDate: '2026-05-01T10:00:00.000Z',
      isVisible: true,
      maxAttempts: 1,
      status: 'published',
      accessMode: 'open_registration',
      challenges: [],
    } as Awaited<ReturnType<typeof examService.getAdminExamById>>)
    vi.mocked(examService.getLeaderboard).mockResolvedValue({
      data: [],
      total: 0,
    } as Awaited<ReturnType<typeof examService.getLeaderboard>>)
  })

  it('uses admin theme variables in light mode instead of hard-coded dark surfaces', async () => {
    render(
      <AdminThemeContext.Provider
        value={{
          adminTheme: 'light',
          toggleAdminTheme: vi.fn(),
          setAdminTheme: vi.fn(),
        }}
      >
        <MemoryRouter initialEntries={['/admin/exams/exam-1/results']}>
          <Routes>
            <Route
              path="/admin/exams/:id/results"
              element={<ExamResultsAdmin />}
            />
          </Routes>
        </MemoryRouter>
      </AdminThemeContext.Provider>
    )

    const subtitle = await screen.findByText('Admin results dashboard')
    const page = subtitle.closest('.min-h-screen')

    expect(page).not.toHaveClass('bg-slate-950')
    expect(page).toHaveStyle({
      backgroundColor: 'var(--admin-bg-primary)',
      color: 'var(--admin-text-primary)',
    })
  })
})
