import { useState, useEffect, useCallback } from 'react'
import { mockChallenges } from '@/mocks/mockChallenges'
import type { Challenge } from '@/types/challenge.types'

// 🔁 Giả lập API call (fetch dữ liệu) dựa trên mockChallenges chia trang
const fetchChallenges = async (
  page: number,
  limit: number
): Promise<Challenge[]> => {
  // mô phỏng delay 0.6s
  await new Promise(resolve => setTimeout(resolve, 600))

  const start = (page - 1) * limit
  const end = start + limit
  return mockChallenges.slice(start, end)
}

// ⚙️ Custom Hook: useInfiniteChallenges
export const useInfiniteChallenges = (limit = 6) => {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)

  const fetchMoreChallenges = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const newData = await fetchChallenges(page, limit)
      setChallenges(prev => [...prev, ...newData])
      setHasMore(newData.length === limit)
      setPage(prev => prev + 1)
    } catch (error) {
      console.error('Error fetching challenges:', error)
    } finally {
      setLoading(false)
    }
  }, [page, limit, hasMore, loading])

  useEffect(() => {
    fetchMoreChallenges()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { challenges, fetchMoreChallenges, hasMore, loading }
}
