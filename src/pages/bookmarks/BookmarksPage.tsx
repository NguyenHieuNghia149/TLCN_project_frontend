import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from '@/components/common/Breadcrumb'
import ChallengeCard from '@/components/challenge/ChallengeCard'
import LessonCard from '@/components/lesson/LessonCard'
import ChallengeSearch from '@/components/challenge/ChallengeSearch'
import LessonSearch from '@/components/lesson/LessonSearch'
import { favoritesService } from '@/services/api/favorites.service'
import { useAuth } from '@/hooks/api/useAuth'
import { Trophy, Sparkles, Bookmark } from 'lucide-react'
import type { Challenge } from '@/types/challenge.types'
import type { Lesson } from '@/types/lesson.types'

const BookmarksPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Challenge filters state
  const [challengeQuery, setChallengeQuery] = useState<string>('')
  const [difficulties, setDifficulties] = useState<string[]>([])

  // Lesson filters state
  const [lessonQuery, setLessonQuery] = useState<string>('')
  const [topics, setTopics] = useState<string[]>([])

  const toggleDifficulty = (value: string) => {
    setDifficulties(prev =>
      prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
    )
  }

  const toggleTopic = (value: string) => {
    setTopics(prev =>
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

        // Fetch both challenge and lesson favorites in parallel
        const [challengesRes, lessonsRes] = await Promise.allSettled([
          favoritesService.getFavorites(),
          favoritesService.getLessonFavorites(),
        ])

        // Handle challenges result
        let transformedChallenges: Challenge[] = []
        if (challengesRes.status === 'fulfilled') {
          const favoriteItems = challengesRes.value?.data || []
          transformedChallenges = favoriteItems
            .filter(data => {
              const passes = data && data.problem && data.problem.id
              return passes
            })
            .map(data => ({
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
            .filter(c => c.id)
        } else {
          console.error(
            '[BookmarksPage] Error fetching challenges:',
            challengesRes.reason
          )
        }

        // Handle lessons result
        let transformedLessons: Lesson[] = []
        if (lessonsRes.status === 'fulfilled') {
          const favoriteLessons = lessonsRes.value?.data || []
          transformedLessons = favoriteLessons
            .filter(data => {
              const passes = data && data.lesson && data.lesson.id
              return passes
            })
            .map(data => ({
              id: data.lesson.id,
              title: data.lesson.title,
              content: data.lesson.content,
              videoUrl: data.lesson.videoUrl,
              topicId: data.lesson.topicId,
              topicName: data.lesson.topicName,
              createdAt: data.lesson.createdAt,
              updatedAt: data.lesson.updatedAt,
              isFavorite: true,
            }))
            .filter(l => l.id)
        } else {
          console.error(
            '[BookmarksPage] Error fetching lessons:',
            lessonsRes.reason
          )
        }

        setChallenges(transformedChallenges)
        setLessons(transformedLessons)
      } catch (err) {
        console.error('[BookmarksPage] Unexpected error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [isAuthenticated])

  const filtered = useMemo(() => {
    return challenges.filter(c => {
      if (
        challengeQuery &&
        !c.title.toLowerCase().includes(challengeQuery.toLowerCase())
      )
        return false
      if (difficulties.length > 0 && !difficulties.includes(c.difficulty))
        return false
      return true
    })
  }, [challenges, challengeQuery, difficulties])

  const filteredLessons = useMemo(() => {
    return lessons.filter(l => {
      if (
        lessonQuery &&
        !l.title.toLowerCase().includes(lessonQuery.toLowerCase())
      )
        return false
      if (topics.length > 0 && !topics.includes(l.topicName || '')) return false
      return true
    })
  }, [lessons, lessonQuery, topics])

  const uniqueTopics = useMemo(() => {
    const topicSet = new Set(
      lessons.map(l => l.topicName).filter((t): t is string => Boolean(t))
    )
    return Array.from(topicSet)
  }, [lessons])

  const handleFavoriteToggle = (challengeId: string, isFavorite: boolean) => {
    // Remove from list if unfavorited
    if (!isFavorite) {
      setChallenges(prev => prev.filter(c => c.id !== challengeId))
    }
  }

  const handleLessonFavoriteToggle = (
    lessonId: string,
    isFavorite: boolean
  ) => {
    // Remove from list if unfavorited
    if (!isFavorite) {
      setLessons(prev => prev.filter(l => l.id !== lessonId))
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
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Bookmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Login Required</h2>
            <p className="mb-4 text-muted-foreground">
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
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
                <div className="text-xs text-muted-foreground">
                  Keep going—every challenge boosts your position.
                </div>
                <div className="flex items-center gap-2">
                  {/* Rank Card */}
                  <div className="group relative overflow-hidden rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent px-3 py-2 transition-all duration-300 hover:border-emerald-400/50 hover:shadow-md hover:shadow-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 transition-transform duration-300 group-hover:scale-110">
                        <Trophy className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80">
                          Rank
                        </div>
                        <div className="text-lg font-bold leading-none text-foreground">
                          {rankDisplay}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Points Card */}
                  <div className="group relative overflow-hidden rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent px-3 py-2 transition-all duration-300 hover:border-amber-400/50 hover:shadow-md hover:shadow-amber-500/20">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 transition-transform duration-300 group-hover:scale-110">
                        <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80">
                          Points
                        </div>
                        <div className="text-lg font-bold leading-none text-foreground">
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
            {/* Left: Bookmarks Content */}
            <div className="space-y-8 lg:col-span-3">
              {/* Problems Section */}
              <section>
                <h2 className="mb-4 text-2xl font-bold">Problems</h2>
                {filtered.length === 0 ? (
                  <div className="rounded-lg border border-border bg-card p-8 text-center">
                    <Bookmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">
                      No problem bookmarks yet
                    </h3>
                    <p className="mb-4 text-muted-foreground">
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
                  <div className="space-y-4">
                    {filtered.map(challenge => (
                      <ChallengeCard
                        key={challenge.id}
                        challenge={challenge}
                        onFavoriteToggle={handleFavoriteToggle}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Lessons Section */}
              <section>
                <h2 className="mb-4 text-2xl font-bold">Lessons</h2>
                {filteredLessons.length === 0 ? (
                  <div className="rounded-lg border border-border bg-card p-8 text-center">
                    <Bookmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">
                      No lesson bookmarks yet
                    </h3>
                    <p className="mb-4 text-muted-foreground">
                      Start bookmarking lessons to see them here
                    </p>
                    <button
                      onClick={() => navigate('/lessons')}
                      className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-400"
                    >
                      Browse Lessons
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredLessons.map(lesson => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        onFavoriteToggle={handleLessonFavoriteToggle}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right: Filters */}
            <aside className="space-y-6">
              {/* Challenge Search and Filters */}
              <div className="bg-transparent">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
                  Problems Filters
                </h3>
                <ChallengeSearch
                  query={challengeQuery}
                  onChange={setChallengeQuery}
                />
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
                      className="h-4 w-4 rounded border-border bg-input text-green-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-sm">Easy</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={difficulties.includes('medium')}
                      onChange={() => toggleDifficulty('medium')}
                      className="h-4 w-4 rounded border-border bg-input text-green-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-sm">Medium</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={difficulties.includes('hard')}
                      onChange={() => toggleDifficulty('hard')}
                      className="h-4 w-4 rounded border-border bg-input text-green-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-sm">Hard</span>
                  </label>
                </div>
              </div>

              {/* Lesson Search and Filters */}
              <div className="bg-transparent pt-6">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
                  Lessons Filters
                </h3>
                <LessonSearch query={lessonQuery} onChange={setLessonQuery} />
              </div>

              <div className="rounded-lg bg-transparent p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
                  Topics
                </h3>
                <div className="space-y-3">
                  {uniqueTopics.length === 0 ? (
                    <p className="text-xs text-gray-500">No topics available</p>
                  ) : (
                    uniqueTopics.map(topic => (
                      <label
                        key={topic}
                        className="flex cursor-pointer items-center gap-3"
                      >
                        <input
                          type="checkbox"
                          checked={topics.includes(topic)}
                          onChange={() => toggleTopic(topic)}
                          className="h-4 w-4 rounded border-border bg-input text-blue-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-sm">{topic}</span>
                      </label>
                    ))
                  )}
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
