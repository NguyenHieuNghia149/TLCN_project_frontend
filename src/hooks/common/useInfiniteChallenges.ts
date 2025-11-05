import { useState, useEffect, useCallback, useRef } from 'react'
import type { Challenge } from '@/types/challenge.types'
import { challengeService } from '@/services/api/challenge.api'

// 🔁 Giả lập API call (fetch dữ liệu) dựa trên mockChallenges chia trang
type BackendChallenge = {
  id: string
  title: string
  description?: string
  difficult?: string
  difficulty?: string
  topic?: string
  createdAt?: string
  isSolve?: boolean
  isFavorite?: boolean
  totalPoints?: number
}

async function fetchChallengesFromService(
  topicId?: string,
  tags?: string[]
): Promise<Challenge[]> {
  if (!topicId) return []
  const data = await challengeService.getChallengesByTopicId(topicId, tags)
  // data can be array or {items: [], nextCursor}
  const items = Array.isArray(data)
    ? (data as BackendChallenge[])
    : (data?.items as unknown[] as BackendChallenge[]) || []
  return items.map((it: BackendChallenge) => {
    const difficulty = (it.difficult || it.difficulty || 'easy')
      .toString()
      .toLowerCase()
    const createdAt = it.createdAt || new Date().toISOString()
    return {
      id: it.id,
      title: it.title,
      description: it.description || '',
      difficulty: difficulty as Challenge['difficulty'],
      topic: it.topic || '',
      createdAt,
      totalPoints:
        typeof it.totalPoints === 'number' ? it.totalPoints : undefined,
      isSolve: Boolean(it.isSolve) || false,
      isFavorite: Boolean(it.isFavorite) || false,
    } as Challenge
  })
}

// ⚙️ Custom Hook: useInfiniteChallenges
export const useInfiniteChallenges = (
  limit = 6,
  topicId?: string,
  tags?: string[]
) => {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const allChallengesRef = useRef<Challenge[]>([])

  const fetchMoreChallenges = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const start = (page - 1) * limit
      const end = start + limit
      const nextSlice = allChallengesRef.current.slice(start, end)
      setChallenges(prev => [...prev, ...nextSlice])
      setHasMore(end < allChallengesRef.current.length)
      setPage(prev => prev + 1)
    } catch (error) {
      console.error('Error fetching challenges:', error)
    } finally {
      setLoading(false)
    }
  }, [page, limit, hasMore, loading])

  useEffect(() => {
    // reset when topicId changes
    setChallenges([])
    setPage(1)
    setHasMore(true)
    allChallengesRef.current = []
    // kick first load
    ;(async () => {
      if (loading) return
      setLoading(true)
      try {
        const all = await fetchChallengesFromService(topicId, tags)
        allChallengesRef.current = all
        const firstPage = all.slice(0, limit)
        setChallenges(firstPage)
        setHasMore(limit < all.length)
        setPage(2)
      } catch (error) {
        console.error('Error fetching challenges:', error)
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, tags, limit])

  return { challenges, fetchMoreChallenges, hasMore, loading }
}
