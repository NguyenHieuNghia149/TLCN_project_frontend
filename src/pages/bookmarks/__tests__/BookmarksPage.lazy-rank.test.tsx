// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BookmarksPage from '../BookmarksPage'

const mocks = vi.hoisted(() => ({
  getLeaderboard: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/api/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    isAuthenticated: true,
  }),
}))

vi.mock('@/config/axios.config', () => ({
  apiClient: {
    get: mocks.getLeaderboard,
  },
}))

vi.mock('@/services/api/favorites.service', () => ({
  favoritesService: {
    getFavorites: vi.fn().mockResolvedValue({ data: [] }),
    getLessonFavorites: vi.fn().mockResolvedValue({ data: [] }),
  },
}))

vi.mock('@/services/api/learned-lesson.service', () => ({
  LearnedLessonService: class LearnedLessonService {
    getCompletedLessons() {
      return Promise.resolve([])
    }
  },
}))

vi.mock('@/components/common/Breadcrumb', () => ({
  default: () => <div data-testid="breadcrumb" />,
}))
vi.mock('@/components/challenge/ChallengeCard', () => ({
  default: () => <div data-testid="challenge-card" />,
}))
vi.mock('@/components/lesson/LessonCard', () => ({
  default: () => <div data-testid="lesson-card" />,
}))
vi.mock('@/components/challenge/ChallengeSearch', () => ({
  default: () => <div data-testid="challenge-search" />,
}))
vi.mock('@/components/lesson/LessonSearch', () => ({
  default: () => <div data-testid="lesson-search" />,
}))

describe('BookmarksPage rank display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getLeaderboard.mockResolvedValue({
      data: { data: { rank: 12, rankingPoint: 345 } },
    })
  })

  it('loads ranking data when the authenticated user opens bookmarks', async () => {
    render(<BookmarksPage />)

    await waitFor(() => {
      expect(mocks.getLeaderboard).toHaveBeenCalledWith(
        '/leaderboard/user/user-1'
      )
    })
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('345')).toBeInTheDocument()
  })
})
