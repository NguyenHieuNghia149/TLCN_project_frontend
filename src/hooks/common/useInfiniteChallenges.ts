import { useState, useEffect, useCallback } from 'react'
import type { Challenge, Cursor } from '@/types/challenge.types'
import { challengeService } from '@/services/api/challenge.service'
import { API_CONFIG } from '@/config/api.config'

type RawChallengeItem = {
  id: string
  title: string
  description?: string | null
  difficulty?: unknown
  difficult?: unknown
  topic?: string
  topicName?: string
  createdAt?: string
  totalPoints?: number
  isSolved?: boolean
  isFavorite?: boolean
}

function normalizeDifficulty(value: unknown): Challenge['difficulty'] {
  const difficulty = typeof value === 'string' ? value.toLowerCase() : ''
  if (difficulty === 'medium' || difficulty === 'hard') {
    return difficulty
  }
  return 'easy'
}

function mapChallengeItem(item: RawChallengeItem): Challenge {
  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    difficulty: normalizeDifficulty(item.difficulty ?? item.difficult),
    topic: item.topic || item.topicName || '',
    createdAt: item.createdAt,
    totalPoints: item.totalPoints,
    isSolved: Boolean(item.isSolved),
    isFavorite: Boolean(item.isFavorite),
  }
}

/**
 * Custom Hook: useInfiniteChallenges
 * Implements cursor-based pagination for lazy loading challenges
 */
export const useInfiniteChallenges = (
  limit = 10,
  topicId?: string,
  tags?: string[],
  userId?: string,
  search?: string,
  difficulties?: string[]
) => {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [rank, setRank] = useState<number | undefined>(undefined)
  const [rankingPoint, setRankingPoint] = useState<number | undefined>(
    undefined
  )
  const [nextCursor, setNextCursor] = useState<Cursor | null>(null)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)

  /**
   * Load more challenges using cursor-based pagination
   */
  const fetchMoreChallenges = useCallback(async () => {
    if (loading || !hasMore || !topicId) return

    setLoading(true)
    try {
      const response = await challengeService.getChallengesByTopicId(
        topicId,
        limit,
        nextCursor,
        {
          tags,
          search,
          difficulties,
        }
      )

      // Map ChallengeItem to Challenge format
      const mappedChallenges: Challenge[] = response.items.map(mapChallengeItem)

      // Append new items to existing challenges
      setChallenges(prev => [...prev, ...mappedChallenges])

      // Capture optional ranking metadata if provided (only on initial or every response)
      if (typeof response.rank === 'number') setRank(response.rank)
      if (typeof response.rankingPoint === 'number')
        setRankingPoint(response.rankingPoint)

      // Update cursor and hasMore state
      setNextCursor(response.nextCursor)
      setHasMore(response.nextCursor !== null)
    } catch (error) {
      console.error('Error fetching challenges:', error)
      setHasMore(false) // Stop trying if there's an error
    } finally {
      setLoading(false)
    }
  }, [topicId, limit, nextCursor, tags, search, difficulties, loading, hasMore])

  /**
   * Reset and load initial data when topicId or tags change
   */
  useEffect(() => {
    // Reset state when topicId or tags change
    setChallenges([])
    setNextCursor(null)
    setHasMore(true)
    setLoading(false)

    // Load initial data
    if (topicId) {
      const loadInitial = async () => {
        setLoading(true)
        try {
          const response = await challengeService.getChallengesByTopicId(
            topicId,
            limit,
            null, // No cursor for initial load
            {
              tags,
              search,
              difficulties,
            }
          )

          // Map ChallengeItem to Challenge format
          const mappedChallenges: Challenge[] =
            response.items.map(mapChallengeItem)

          setChallenges(mappedChallenges)
          setNextCursor(response.nextCursor)
          setHasMore(response.nextCursor !== null)

          // Capture optional ranking metadata returned from initial load
          if (typeof response.rank === 'number') setRank(response.rank)
          if (typeof response.rankingPoint === 'number')
            setRankingPoint(response.rankingPoint)
        } catch (error) {
          console.error('Error fetching initial challenges:', error)
          setHasMore(false)
        } finally {
          setLoading(false)
        }
      }

      loadInitial()
    }
  }, [topicId, tags, limit, search, difficulties])

  // Fallback: fetch rank from leaderboard API if not provided by challenge list
  useEffect(() => {
    if (!userId || rank !== undefined) return

    let cancelled = false
    const fetchRank = async () => {
      try {
        const response = await fetch(
          `${API_CONFIG.baseURL}/leaderboard/user/${userId}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        )
        if (!response.ok || cancelled) return
        const data = await response.json()
        if (data.success && data.data) {
          const entry = data.data
          const rankVal =
            typeof entry.rank === 'string'
              ? parseInt(entry.rank, 10)
              : entry.rank
          const pointsVal =
            typeof entry.rankingPoint === 'string'
              ? parseInt(entry.rankingPoint, 10)
              : entry.rankingPoint
          if (!cancelled) {
            if (Number.isFinite(rankVal)) setRank(rankVal)
            if (Number.isFinite(pointsVal)) setRankingPoint(pointsVal)
          }
        }
      } catch {
        // Silently ignore — rank is non-critical
      }
    }
    fetchRank()
    return () => {
      cancelled = true
    }
  }, [userId, rank])

  return {
    challenges,
    fetchMoreChallenges,
    hasMore,
    loading,
    rank,
    rankingPoint,
  }
}
