// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { App } from 'antd'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    getAdminProctoringReview: vi.fn(),
    recomputeAdminProctoringReview: vi.fn(),
    reviewAdminProctoring: vi.fn(),
    labelAdminProctoringReview: vi.fn(),
    translateAdminProctoringLlmSummary: vi.fn(),
  },
}))

function renderPage() {
  return render(
    <App>
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
    </App>
  )
}

describe('ExamResultsAdmin submission detail tabs', () => {
  beforeEach(() => {
    vi.mocked(examService.getAdminExamById).mockResolvedValue({
      id: 'exam-1',
      slug: 'spring-midterm',
      title: 'Spring Midterm',
      duration: 60,
      startDate: '2026-05-01T09:00:00.000Z',
      endDate: '2026-05-01T10:00:00.000Z',
      createdAt: '2026-04-15T12:00:00.000Z',
      isVisible: true,
      maxAttempts: 1,
      status: 'published',
      accessMode: 'open_registration',
      challenges: [
        {
          id: 'challenge-1',
          title: 'FizzBuzz',
        },
      ],
    } as Awaited<ReturnType<typeof examService.getAdminExamById>>)
    vi.mocked(examService.getLeaderboard).mockResolvedValue({
      data: [
        {
          id: 'participation-1',
          userId: 'user-1',
          submittedAt: '2026-06-23T02:03:45.000Z',
          totalScore: 0,
          scoreStatus: 'scored',
          user: {
            firstname: 'Pham Tien',
            lastname: 'Manh',
            email: 'quadas897@gmail.com',
          },
          perProblem: [
            {
              problemId: 'challenge-1',
              obtained: 0,
              maxPoints: 100,
            },
          ],
        },
      ],
      total: 1,
    } as Awaited<ReturnType<typeof examService.getLeaderboard>>)
    vi.mocked(examService.getSubmissionDetails).mockResolvedValue({
      participationId: 'participation-1',
      startedAt: '2026-06-23T02:02:37.000Z',
      submittedAt: '2026-06-23T02:03:45.000Z',
      totalScore: 0,
      durationMinutes: 1,
      user: {
        firstname: 'Pham Tien',
        lastname: 'Manh',
        email: 'quadas897@gmail.com',
      },
      solutions: [
        {
          challengeId: 'challenge-1',
          challengeTitle: 'FizzBuzz',
          language: 'cpp',
          code: 'int main() { return 0; }',
          score: 0,
          totalTests: 3,
          passedCount: 0,
          submittedAt: '2026-06-23T02:03:45.000Z',
        },
      ],
    } as Awaited<ReturnType<typeof examService.getSubmissionDetails>>)
    vi.mocked(examService.getAdminProctoringReview).mockResolvedValue({
      summary: {
        id: 'summary-1',
        examId: 'exam-1',
        participationId: 'participation-1',
        riskScore: 24,
        riskLevel: 'low',
        eventCountsJson: { focus_lost: 2 },
        velocityJson: {},
        finalFlushStatus: 'persisted',
        deterministicSchemaVersion: 'phase-1-deterministic-risk-v1',
        computedAt: '2026-06-23T02:04:00.000Z',
        reviewerDecision: 'pending',
        reviewerId: null,
        reviewerNotes: null,
        reviewedAt: null,
      },
      timeline: {
        items: [
          {
            id: 'event-1',
            type: 'telemetry.batch',
            eventName: 'focus_lost',
            severity: 'warning',
            clientSeq: 1,
            capturedAt: '2026-06-23T02:03:04.000Z',
            receivedAt: '2026-06-23T02:03:05.000Z',
            finalFlushReceiptId: null,
            payloadJson: { eventName: 'focus_lost' },
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
      },
      evidence: {
        consent: [],
        precheck: [],
        bypass: [],
        finalFlush: [{ id: 'receipt-1', status: 'persisted' }],
        dataRequests: [],
      },
      aiAdvisory: {
        visible: false,
        status: 'hidden_shadow_mode',
        windows: [],
      },
      llmSummary: {
        visible: true,
        status: 'accepted',
        summaryId: 'llm-summary-1',
        provider: 'local',
        modelVersion: 'summary-local-v1',
        promptVersion: 'proctoring-summary-v1',
        validationStatus: 'passed',
        validationScore: 1,
        summaryText:
          'Review these signals: focus lost x2 and visibility hidden x1.',
        riskFacts: [],
        citations: [],
        missingDataNotes: [],
        modelNotes: [],
        completedAt: '2026-06-23T02:04:56.000Z',
      },
    } as Awaited<ReturnType<typeof examService.getAdminProctoringReview>>)
  })

  it('opens submission details with Candidate & Code as the default tab and moves AI content into a separate tab', async () => {
    const user = userEvent.setup()

    renderPage()

    await user.click(
      await screen.findByRole('button', { name: /view details/i })
    )

    expect(await screen.findByText('Submission details')).toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: /candidate & code/i })
    ).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: /ai review/i })).toHaveAttribute(
      'aria-selected',
      'false'
    )

    const candidateTabPanel = screen.getByRole('tabpanel')
    expect(
      within(candidateTabPanel).getByText('Candidate snapshot')
    ).toBeInTheDocument()
    expect(
      within(candidateTabPanel).getAllByText('Pham Tien Manh').length
    ).toBeGreaterThan(0)
    expect(within(candidateTabPanel).getByText('FizzBuzz')).toBeInTheDocument()
    expect(within(candidateTabPanel).getByText('Code')).toBeInTheDocument()
    expect(
      screen.queryByText('Deterministic proctoring review')
    ).not.toBeInTheDocument()
  })

  it('shows AI Review as three grouped sections: Overview, Evidence, and AI Summary', async () => {
    const user = userEvent.setup()

    renderPage()

    await user.click(
      await screen.findByRole('button', { name: /view details/i })
    )
    await user.click(await screen.findByRole('tab', { name: /ai review/i }))

    expect(screen.getByRole('tab', { name: /ai review/i })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect((await screen.findAllByText('Overview')).length).toBeGreaterThan(0)
    expect(screen.getByText('Evidence')).toBeInTheDocument()
    expect(screen.getByText('AI Summary')).toBeInTheDocument()

    const overviewHeadings = screen.getAllByText('Overview')
    const aiPanel = overviewHeadings[0]?.closest('.rounded-2xl')?.parentElement
    expect(aiPanel).not.toBeNull()
    expect(screen.getByText('Risk level')).toBeInTheDocument()
    expect(screen.getByText('Evidence summary')).toBeInTheDocument()
    expect(screen.getByText('LLM review summary')).toBeInTheDocument()

    const overviewSection = overviewHeadings[0]?.closest('section')
    expect(overviewSection).not.toBeNull()
    expect(
      within(overviewSection as HTMLElement).getByText('Review attention')
    ).toBeInTheDocument()
  })
})
