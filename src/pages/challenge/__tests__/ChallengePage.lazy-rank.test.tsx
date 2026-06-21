// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import ChallengePage from '../ChallengePage'

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
  useInfiniteChallenges: () => ({
    challenges: [],
    fetchMoreChallenges: vi.fn(),
    hasMore: false,
    loading: false,
    rank: 7,
    rankingPoint: 42,
  }),
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
vi.mock('@/components/challenge/ChallengeSearch', () => ({
  default: () => <div data-testid="challenge-search" />,
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

describe('ChallengePage rank display', () => {
  it('renders page-loaded ranking metadata rather than session user ranking fields', () => {
    render(<ChallengePage />)

    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.queryByText('99')).not.toBeInTheDocument()
    expect(screen.queryByText('999')).not.toBeInTheDocument()
  })
})
