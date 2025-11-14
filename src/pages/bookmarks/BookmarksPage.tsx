import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from '@/components/common/Breadcrumb'
import ChallengeCard from '@/components/challenge/ChallengeCard'
import ChallengeSearch from '@/components/challenge/ChallengeSearch'
import { favoritesService } from '@/services/api/favorites.service'
import { useAuth } from '@/hooks/api/useAuth'
import { Trophy, Sparkles, Bookmark } from 'lucide-react'
import type { Challenge } from '@/types/challenge.types'

const BookmarksPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Filters state
  const [query, setQuery] = useState<string>('')
  const [difficulties, setDifficulties] = useState<string[]>([])
  const [showSolved, setShowSolved] = useState<boolean>(false)

  const toggleDifficulty = (value: string) => {
    setDifficulties(prev =>
      prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
    )
  }

  // Fetch favorites
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated) {
        setError('Please login to view your bookmarks')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await favoritesService.getFavorites()
        const favoriteItems = response.data || []

        const transformedChallenges: Challenge[] = favoriteItems.map(data => ({
          id: data.problem.id,
          title: data.problem.title,
          description: data.problem.description,
          difficulty: data.problem.difficulty,
          topic: '', // You might want to fetch topic name separately
          createdAt: data.problem.createdAt,
          updatedAt: data.problem.updatedAt,
          totalPoints: data.problem.totalPoints,
          isSolved: data.problem.isSolved,
          isFavorite: data.problem.isFavorite,
        }))

        setChallenges(transformedChallenges)
      } catch (err) {
        console.error('Error fetching favorites:', err)
        setError('Failed to load bookmarks. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [isAuthenticated])

  const filtered = useMemo(() => {
    return challenges.filter(c => {
      if (query && !c.title.toLowerCase().includes(query.toLowerCase()))
        return false
      if (difficulties.length > 0 && !difficulties.includes(c.difficulty))
        return false
      if (showSolved && !c.isSolved) return false
      return true
    })
  }, [challenges, query, difficulties, showSolved])

  const handleFavoriteToggle = (challengeId: string, isFavorite: boolean) => {
    // Remove from list if unfavorited
    if (!isFavorite) {
      setChallenges(prev => prev.filter(c => c.id !== challengeId))
    }
  }

  const rankDisplay = useMemo(() => {
    if (!user || user.rank === undefined || user.rank === null) {
      return '—'
    }
    return new Intl.NumberFormat().format(user.rank)
  }, [user])

  const rankingPointDisplay = useMemo(() => {
    if (
      !user ||
      user.rankingPoint === undefined ||
      user.rankingPoint === null
    ) {
      return '—'
    }
    return new Intl.NumberFormat().format(user.rankingPoint)
  }, [user])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#121418] text-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="rounded-lg border border-gray-800 bg-[#1f202a] p-8 text-center">
            <Bookmark className="mx-auto mb-4 h-12 w-12 text-gray-500" />
            <h2 className="mb-2 text-xl font-semibold">Login Required</h2>
            <p className="mb-4 text-gray-400">
              Please login to view your bookmarks
            </p>
            <button
              onClick={() => navigate('/login')}
              className="rounded bg-green-500 px-4 py-2 text-black transition-colors hover:bg-green-400"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121418] text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#1f202a]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Breadcrumb
              items={[
                { label: 'Prepare', to: '/dashboard' },
                { label: 'Bookmarks' },
              ]}
            />
            <h1 className="mt-1 text-xl font-bold">My Bookmarks</h1>
          </div>
          <div className="text-right">
            {isAuthenticated && user ? (
              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-gray-400">
                  Keep going—every challenge boosts your position.
                </div>
                <div className="flex items-center gap-2">
                  {/* Rank Card */}
                  <div className="group relative overflow-hidden rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent px-3 py-2 transition-all duration-300 hover:border-emerald-400/50 hover:shadow-md hover:shadow-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 transition-transform duration-300 group-hover:scale-110">
                        <Trophy className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/80">
                          Rank
                        </div>
                        <div className="text-lg font-bold leading-none text-white">
                          {rankDisplay}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Points Card */}
                  <div className="group relative overflow-hidden rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent px-3 py-2 transition-all duration-300 hover:border-amber-400/50 hover:shadow-md hover:shadow-amber-500/20">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 transition-transform duration-300 group-hover:scale-110">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wider text-amber-400/80">
                          Points
                        </div>
                        <div className="text-lg font-bold leading-none text-white">
                          {rankingPointDisplay}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {loading ? (
          <div className="text-center text-gray-500">
            <p>Loading bookmarks...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-center text-red-400">
            <p>{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Left: List */}
            <div className="space-y-4 lg:col-span-3">
              {filtered.length === 0 ? (
                <div className="rounded-lg border border-gray-800 bg-[#1f202a] p-8 text-center">
                  <Bookmark className="mx-auto mb-4 h-12 w-12 text-gray-500" />
                  <h3 className="mb-2 text-lg font-semibold">
                    No bookmarks yet
                  </h3>
                  <p className="mb-4 text-gray-400">
                    Start bookmarking challenges to see them here
                  </p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="rounded bg-green-500 px-4 py-2 text-black transition-colors hover:bg-green-400"
                  >
                    Browse Challenges
                  </button>
                </div>
              ) : (
                <>
                  {filtered.map(challenge => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onFavoriteToggle={handleFavoriteToggle}
                    />
                  ))}
                </>
              )}
            </div>

            {/* Right: Filters */}
            <aside className="space-y-6">
              <div className="bg-transparent">
                <ChallengeSearch query={query} onChange={setQuery} />
              </div>

              <div className="rounded-lg bg-transparent p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
                  Status
                </h3>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={showSolved}
                      onChange={e => setShowSolved(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-sm">Solved</span>
                  </label>
                </div>
              </div>

              <div className="rounded-lg bg-transparent p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
                  Difficulty
                </h3>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={difficulties.includes('easy')}
                      onChange={() => toggleDifficulty('easy')}
                      className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-sm">Easy</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={difficulties.includes('medium')}
                      onChange={() => toggleDifficulty('medium')}
                      className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-sm">Medium</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={difficulties.includes('hard')}
                      onChange={() => toggleDifficulty('hard')}
                      className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-sm">Hard</span>
                  </label>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookmarksPage
