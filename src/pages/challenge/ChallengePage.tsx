import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Breadcrumb from '@/components/common/Breadcrumb'
import { useInfiniteChallenges } from '@/hooks/common/useInfiniteChallenges'
import ChallengeCard from '@/components/challenge/ChallengeCard'
import ChallengeSearch from '@/components/challenge/ChallengeSearch'

const ChallengePage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const rawCategory = (searchParams.get('category') || '').toLowerCase()
  const categoryLabelMap: Record<string, string> = {
    algorithms: 'Algorithms',
    'data-structures': 'Data Structures',
  }
  const categoryLabel = categoryLabelMap[rawCategory] || 'Algorithms'
  const { challenges, fetchMoreChallenges, hasMore, loading } =
    useInfiniteChallenges(8)
  const observerRef = useRef<HTMLDivElement | null>(null)

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

  const filtered = useMemo(() => {
    return challenges.filter(c => {
      if (query && !c.title.toLowerCase().includes(query.toLowerCase()))
        return false
      if (difficulties.length > 0 && !difficulties.includes(c.difficulty))
        return false
      if (showSolved && !c.isSolve) return false
      if (showFavorites && !c.isFavorite) return false
      return true
    })
  }, [challenges, query, difficulties, showSolved, showFavorites])

  return (
    <div className="min-h-screen bg-[#121418] text-gray-100">
      {/* Header */}
      <header className="min-h-24 border-b border-gray-800 bg-[#1f202a]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div>
            <Breadcrumb
              items={[
                { label: 'Prepare', to: '/dashboard' },
                { label: categoryLabel },
              ]}
            />
            <h1 className="text-2xl font-bold">Problem Solving</h1>
          </div>
          <div className="text-right">
            <div className="mb-1 text-sm">
              <span className="text-orange-400">39 more points</span>
              <span className="text-white"> to get your next star!</span>
            </div>
            <div className="text-sm text-gray-400">
              Rank: <span className="font-semibold text-white">2377771</span> |
              Points: <span className="font-semibold text-white">61/100</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left: List */}
          <div className="space-y-4 lg:col-span-3">
            {filtered.map(ch => (
              <ChallengeCard key={ch.id} challenge={ch} />
            ))}
            {loading && (
              <p className="py-4 text-center text-gray-500">Loading more...</p>
            )}
            {!hasMore && (
              <p className="py-4 text-center text-gray-500">
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
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={showFavorites}
                    onChange={e => setShowFavorites(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-sm">Favorites</span>
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
      </div>
    </div>
  )
}

export default ChallengePage
