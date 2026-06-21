// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import ReactDOM from 'react-dom/client'

const mocks = vi.hoisted(() => {
  const stableFn = vi.fn()
  const proctoringObj = {
    settingsLoading: false,
    settingsError: null as string | null,
    settings: null as Record<string, unknown> | null,
    proctoringRequired: false,
    startReady: true,
    markStartSucceeded: vi.fn(),
    stopAllMedia: vi.fn(),
    setError: vi.fn(),
    clientSessionId: 'cs-1',
    startPayload: {},
  }
  return {
    getPublicExam: vi.fn(),
    getExamAccessState: vi.fn(),
    startEntrySession: vi.fn(),
    stableFn,
    proctoringObj,
  }
})

vi.mock('react-router-dom', () => ({
  useParams: () => ({ examSlug: 't' }),
  useNavigate: () => mocks.stableFn,
  useLocation: () => ({ pathname: '/exam/t/entry', search: '' }),
  useSearchParams: () => [new URLSearchParams('')],
}))
vi.mock('react-redux', () => ({ useDispatch: () => mocks.stableFn }))
vi.mock('@/hooks/api/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1' }, isAuthenticated: true }),
}))
vi.mock('@/services/api/exam.service', () => ({
  examService: {
    getPublicExam: mocks.getPublicExam,
    getExamAccessState: mocks.getExamAccessState,
    getExamById: vi.fn(),
    resolveInvite: vi.fn(),
    registerForExam: vi.fn(),
    sendExamOtp: vi.fn(),
    verifyExamOtp: vi.fn(),
    startEntrySession: mocks.startEntrySession,
  },
}))
vi.mock('@/hooks/useExamProctoring', () => ({
  useExamProctoring: () => mocks.proctoringObj,
}))
vi.mock('@/services/auth/token.service', () => ({
  tokenManager: { setAccessToken: vi.fn() },
}))
vi.mock('@/store/slices/examSlice', () => ({ setParticipation: vi.fn() }))
vi.mock('@/store/slices/authSlice', () => ({ initializeSession: vi.fn() }))
vi.mock('@/components/common/LoadingSpinner', () => ({ default: () => null }))
vi.mock('@/components/common/Button/Button', () => ({ default: () => null }))
vi.mock('@/pages/exam/access/components/ExamEntryStatusPanel', () => ({
  default: () => null,
}))
vi.mock('@/pages/exam/access/components/ExamEntryVerificationPanel', () => ({
  default: () => null,
}))
vi.mock('@/pages/exam/access/components/ExamEntryLobbyPanel', () => ({
  default: ({
    onStartOrResume,
    canStart,
  }: {
    onStartOrResume: () => void
    canStart: boolean
  }) =>
    React.createElement(
      'button',
      {
        'data-testid': 'start-exam-btn',
        disabled: !canStart,
        onClick: onStartOrResume,
      },
      'Start'
    ),
}))
vi.mock('@/pages/exam/access/components/ProctoringEntryModal', () => ({
  default: () => null,
}))

import ExamAccessPage from '@/pages/exam/access/ExamAccessPage'

function makeExam() {
  const p = new Date()
  p.setFullYear(p.getFullYear() - 1)
  const f = new Date()
  f.setFullYear(f.getFullYear() + 1)
  return {
    id: 'e1',
    slug: 't',
    title: 'T',
    accessMode: 'open',
    status: 'published',
    startDate: p.toISOString(),
    endDate: f.toISOString(),
    duration: 60,
    maxAttempts: 2,
    selfRegistrationApprovalMode: 'auto',
  }
}
function makeAS(o: Record<string, unknown> = {}) {
  return {
    examId: 'e1',
    accessStatus: 'active',
    approvalStatus: 'approved',
    requiresLogin: false,
    requiresOtp: false,
    requiresPassword: false,
    canStart: true,
    entrySessionId: 'e1',
    entrySessionStatus: 'eligible',
    ...o,
  }
}
function setP(o: Record<string, unknown>) {
  Object.assign(mocks.proctoringObj, {
    settingsLoading: false,
    settingsError: null,
    settings: null,
    proctoringRequired: false,
    startReady: true,
    ...o,
  })
}
function mkEnv() {
  const c = document.createElement('div')
  document.body.appendChild(c)
  return { c, r: ReactDOM.createRoot(c) }
}
function rmEnv(c: HTMLDivElement, r: ReactDOM.Root) {
  r.unmount()
  c.remove()
}

describe('ExamAccessPage proctoring flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPublicExam.mockResolvedValue(makeExam())
    mocks.getExamAccessState.mockResolvedValue(makeAS())
    setP({})
  })
  afterEach(() => {
    cleanup()
  })

  it('shows loading text and disables Start while settings load', async () => {
    setP({ settingsLoading: true, startReady: false })
    const { c, r } = mkEnv()
    try {
      r.render(React.createElement(ExamAccessPage))
      await waitFor(
        () => expect(screen.getByTestId('start-exam-btn')).toBeInTheDocument(),
        { timeout: 5000, interval: 50 }
      )
      expect(
        screen.getByText('Loading proctoring settings...')
      ).toBeInTheDocument()
      expect(screen.getByTestId('start-exam-btn')).toBeDisabled()
    } finally {
      rmEnv(c, r)
    }
  })

  it('does not call startEntrySession when Start clicked while settings load', async () => {
    setP({ settingsLoading: true, startReady: false })
    const { c, r } = mkEnv()
    try {
      r.render(React.createElement(ExamAccessPage))
      await waitFor(
        () => expect(screen.getByTestId('start-exam-btn')).toBeInTheDocument(),
        { timeout: 5000, interval: 50 }
      )
      await userEvent.click(screen.getByTestId('start-exam-btn'))
      expect(mocks.startEntrySession).not.toHaveBeenCalled()
    } finally {
      rmEnv(c, r)
    }
  })

  it('shows settingsError and disables Start on load failure', async () => {
    const errMsg =
      'Failed to load proctoring settings. Please refresh the page and try again.'
    setP({ settingsLoading: false, settingsError: errMsg, startReady: false })
    const { c, r } = mkEnv()
    try {
      r.render(React.createElement(ExamAccessPage))
      await waitFor(
        () => expect(screen.getByTestId('start-exam-btn')).toBeInTheDocument(),
        { timeout: 5000, interval: 50 }
      )
      expect(screen.getByText(errMsg)).toBeInTheDocument()
      expect(screen.getByTestId('start-exam-btn')).toBeDisabled()
    } finally {
      rmEnv(c, r)
    }
  })
})
