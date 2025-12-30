import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import Breadcrumb from '@/components/common/Breadcrumb'
import { useInfiniteChallenges } from '@/hooks/common/useInfiniteChallenges'
import ChallengeCard from '@/components/challenge/ChallengeCard'
import ChallengeSearch from '@/components/challenge/ChallengeSearch'
import { challengeService } from '@/services/api/challenge.service'
import { useAuth } from '@/hooks/api/useAuth'
import { Trophy, Sparkles } from 'lucide-react'

const ChallengePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()
  const rawCategory = (searchParams.get('category') || '').toLowerCase()
  const { challengeId: topicId } = useParams<{ challengeId: string }>()
  const categoryLabel = useMemo(() => {
    const formatted = rawCategory
      .split('-')
      .map(s => (s ? s[0].toUpperCase() + s.slice(1) : s))
      .join(' ')
    return formatted || 'Algorithms'
  }, [rawCategory])

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const {
    challenges,
    fetchMoreChallenges,
    hasMore,
    loading,
    rank,
    rankingPoint,
  } = useInfiniteChallenges(8, topicId, selectedTags)
  const observerRef = useRef<HTMLDivElement | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])

  // Filters state
  const [query, setQuery] = useState<string>('')
  const [difficulties, setDifficulties] = useState<string[]>([])
  const [showSolved, setShowSolved] = useState<boolean>(false)
  const [showFavorites, setShowFavorites] = useState<boolean>(false)

  const toggleDifficulty = (value: string) => {
    setDifficulties(prev =>
      prev.includes(value) ? prev.filter(d => d !== value) : [...prev, value]
    )
  }

  const onIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const first = entries[0]
      if (first.isIntersecting && hasMore && !loading) {
        fetchMoreChallenges()
      }
    },
    [fetchMoreChallenges, hasMore, loading]
  )

  useEffect(() => {
    if (!observerRef.current) return

    const observer = new IntersectionObserver(onIntersect, { threshold: 1.0 })
    observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [onIntersect])

  // Load available tags for this topic
  useEffect(() => {
    let isMounted = true
    if (!topicId) {
      setAvailableTags([])
      return
    }
    challengeService
      .getTagsByTopicId(topicId)
      .then(tags => {
        if (!isMounted) return
        setAvailableTags(Array.isArray(tags) ? tags : [])
      })
      .catch(() => {
        if (!isMounted) return
        setAvailableTags([])
      })
    return () => {
      isMounted = false
    }
  }, [topicId])

  const filtered = useMemo(() => {
    return challenges.filter(c => {
      if (query && !c.title.toLowerCase().includes(query.toLowerCase()))
        return false
      if (difficulties.length > 0 && !difficulties.includes(c.difficulty))
        return false
      if (showSolved && !c.isSolved) return false
      if (showFavorites && !c.isFavorite) return false
      return true
    })
  }, [challenges, query, difficulties, showSolved, showFavorites])

  const rankDisplay = useMemo(() => {
    // Prefer user.rank from auth session; fall back to topic-level rank returned by challenges endpoint
    const value =
      (user && typeof user.rank === 'number' ? user.rank : undefined) ??
      (typeof rank === 'number' ? rank : undefined)

    if (value === undefined || value === null) return '—'
    return new Intl.NumberFormat().format(value)
  }, [user, rank])

  const rankingPointDisplay = useMemo(() => {
    const value =
      (user && typeof user.rankingPoint === 'number'
        ? user.rankingPoint
        : undefined) ??
      (typeof rankingPoint === 'number' ? rankingPoint : undefined)

    if (value === undefined || value === null) return '—'
    return new Intl.NumberFormat().format(value)
  }, [user, rankingPoint])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Breadcrumb
              items={[
                { label: 'Prepare', to: '/dashboard' },
                { label: categoryLabel },
              ]}
            />
            <h1 className="mt-1 text-xl font-bold">{categoryLabel}</h1>
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
                        <Trophy className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/80">
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
                        <Sparkles className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-wider text-amber-400/80">
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
            ) : (
              <div className="flex flex-col items-end gap-0.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  Track your competitive progress.
                </span>
                <span>
                  Sign in to unlock personalized rank and point insights.
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left: List */}
          <div className="space-y-4 lg:col-span-3">
            {filtered.map(challenge => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
            {loading && (
              <p className="py-4 text-center text-muted-foreground">
                Loading more...
              </p>
            )}
            {!hasMore && (
              <p className="py-4 text-center text-muted-foreground">
                No more challenges...
              </p>
            )}
            <div ref={observerRef} className="h-10" />
          </div>

          {/* Right: Filters */}
          <aside className="space-y-6">
            <div className="bg-transparent">
              <ChallengeSearch query={query} onChange={setQuery} />
            </div>

            <div className="rounded-lg bg-transparent p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Status
              </h3>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={showSolved}
                    onChange={e => setShowSolved(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-input text-green-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-sm">Solved</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={showFavorites}
                    onChange={e => setShowFavorites(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-input text-green-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-sm">Favorites</span>
                </label>
              </div>
            </div>

            <div className="rounded-lg bg-transparent p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
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

            <div className="rounded-lg bg-transparent p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Subdomains
              </h3>
              <div className="space-y-3">
                {availableTags.map(tag => {
                  const checked = selectedTags.includes(tag)
                  return (
                    <label
                      key={tag}
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedTags(prev =>
                            checked
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          )
                        }
                        className="h-4 w-4 rounded border-border bg-input text-green-500 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-sm capitalize">{tag}</span>
                    </label>
                  )
                })}
                {availableTags.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tags</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default ChallengePage
