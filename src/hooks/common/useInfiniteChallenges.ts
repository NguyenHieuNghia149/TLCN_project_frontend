import { useState, useEffect, useCallback } from 'react'
import type { Challenge, Cursor } from '@/types/challenge.types'
import { challengeService } from '@/services/api/challenge.service'

/**
 * Custom Hook: useInfiniteChallenges
 * Implements cursor-based pagination for lazy loading challenges
 */
export const useInfiniteChallenges = (
  limit = 10,
  topicId?: string,
  tags?: string[]
) => {
  const [challenges, setChallenges] = useState<Challenge[]>([])
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
        tags
      )

      // Map ChallengeItem to Challenge format
      const mappedChallenges: Challenge[] = response.items.map(item => {
        const difficulty = (item.difficult || 'easy')
          .toString()
          .toLowerCase() as Challenge['difficulty']

        return {
          id: item.id,
          title: item.title,
          description: item.description || '',
          difficulty: difficulty,
          topic: '', // Will be set from context if needed
          createdAt: item.createdAt,
          totalPoints: item.totalPoints,
          isSolved: Boolean(item.isSolved),
          isFavorite: Boolean(item.isFavorite),
        }
      })

      // Append new items to existing challenges
      setChallenges(prev => [...prev, ...mappedChallenges])

      // Update cursor and hasMore state
      setNextCursor(response.nextCursor)
      setHasMore(response.nextCursor !== null)
    } catch (error) {
      console.error('Error fetching challenges:', error)
      setHasMore(false) // Stop trying if there's an error
    } finally {
      setLoading(false)
    }
  }, [topicId, limit, nextCursor, tags, loading, hasMore])

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
            tags
          )

          // Map ChallengeItem to Challenge format
          const mappedChallenges: Challenge[] = response.items.map(item => {
            const difficulty = (item.difficult || 'easy')
              .toString()
              .toLowerCase() as Challenge['difficulty']

            return {
              id: item.id,
              title: item.title,
              description: item.description || '',
              difficulty: difficulty,
              topic: '', // Will be set from context if needed
              createdAt: item.createdAt,
              totalPoints: item.totalPoints,
              isSolved: Boolean(item.isSolved),
              isFavorite: Boolean(item.isFavorite),
            }
          })

          setChallenges(mappedChallenges)
          setNextCursor(response.nextCursor)
          setHasMore(response.nextCursor !== null)
        } catch (error) {
          console.error('Error fetching initial challenges:', error)
          setHasMore(false)
        } finally {
          setLoading(false)
        }
      }

      loadInitial()
    }
  }, [topicId, tags, limit])

  return { challenges, fetchMoreChallenges, hasMore, loading }
}
