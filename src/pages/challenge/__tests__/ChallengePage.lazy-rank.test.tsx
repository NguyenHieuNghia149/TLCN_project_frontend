// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import ChallengePage from '../ChallengePage'

const useInfiniteChallengesMock = vi.fn()

vi.mock('react-router-dom', () => ({
  useParams: () => ({ challengeId: 'topic-1' }),
  useSearchParams: () => [new URLSearchParams()],
}))

vi.mock('@/hooks/api/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', rank: 99, rankingPoint: 999 },
    isAuthenticated: true,
  }),
}))

vi.mock('@/hooks/common/useInfiniteChallenges', () => ({
  useInfiniteChallenges: (...args: unknown[]) =>
    useInfiniteChallengesMock(...args),
}))

vi.mock('@/services/api/challenge.service', () => ({
  challengeService: {
    getTagsByTopicId: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/components/common/Breadcrumb', () => ({
  default: () => <div data-testid="breadcrumb" />,
}))
vi.mock('@/components/challenge/ChallengeCard', () => ({
  default: () => <div data-testid="challenge-card" />,
}))
beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class IntersectionObserver {
      observe() {}
      disconnect() {}
    }
  )
})

beforeEach(() => {
  useInfiniteChallengesMock.mockReset()
})

const buildChallengeHookResponse = () => ({
  challenges: [],
  fetchMoreChallenges: vi.fn(),
  hasMore: false,
  loading: false,
  rank: 7,
  rankingPoint: 42,
})

describe('ChallengePage rank display', () => {
  it('renders page-loaded ranking metadata rather than session user ranking fields', () => {
    useInfiniteChallengesMock.mockReturnValue(buildChallengeHookResponse())

    render(<ChallengePage />)

    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.queryByText('99')).not.toBeInTheDocument()
    expect(screen.queryByText('999')).not.toBeInTheDocument()
  })

  it('forwards search text and difficulty filters into the infinite challenge query', () => {
    useInfiniteChallengesMock.mockReturnValue(buildChallengeHookResponse())

    render(<ChallengePage />)

    fireEvent.change(
      screen.getAllByPlaceholderText('Search challenges...')[0]!,
      {
        target: { value: 'tree' },
      }
    )
    fireEvent.click(screen.getAllByLabelText('Medium')[0]!)
    fireEvent.click(screen.getAllByLabelText('Hard')[0]!)

    const lastCall =
      useInfiniteChallengesMock.mock.calls[
        useInfiniteChallengesMock.mock.calls.length - 1
      ]

    expect(lastCall).toEqual([
      8,
      'topic-1',
      [],
      'user-1',
      'tree',
      ['medium', 'hard'],
    ])
  })
})
