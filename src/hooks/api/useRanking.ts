import { useState, useEffect, useMemo } from 'react'
import { API_CONFIG } from '@/config/api.config'
import { RankingFilters, RankingUser } from '@/types/ranking.types'
import { useAuth } from './useAuth'

export interface UserRankData extends RankingUser {
  percentile: number
}

export const useRanking = (filters: RankingFilters = {}) => {
  const { user: currentUser } = useAuth()
  const [ranking, setRanking] = useState<RankingUser[]>([])
  const [userRank, setUserRank] = useState<UserRankData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
  })

  const serializedFilters = useMemo(
    () => JSON.stringify(filters ?? {}),
    [filters]
  )

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch user rank if logged in
        if (currentUser?.id) {
          try {
            const url = `${API_CONFIG.baseURL}/leaderboard/user/${currentUser.id}`
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            })

            if (response.ok) {
              const data = await response.json()
              if (data.success && data.data) {
                const entry = data.data
                const rankData: UserRankData = {
                  id: entry.id,
                  rank:
                    typeof entry.rank === 'string'
                      ? parseInt(entry.rank, 10)
                      : entry.rank,
                  firstName: entry.firstName || '',
                  lastName: entry.lastName || '',
                  email: entry.email,
                  avatar: entry.avatar || null,
                  acceptedProblems: entry.submissionCount,
                  totalSubmissions: entry.submissionCount,
                  successRate: 0,
                  rankingPoint: entry.rankingPoint,
                  createdAt: entry.createdAt || new Date().toISOString(),
                  percentile: entry.percentile || 0,
                }
                setUserRank(rankData)
              }
            }
          } catch {
            // Silently fail if user rank fetch fails
          }
        }

        // Fetch leaderboard ranking
        const params = new URLSearchParams()
        if (filters.page) params.append('page', filters.page.toString())
        if (filters.limit)
          params.append('limit', (filters.limit || 20).toString())
        if (filters.search) params.append('search', filters.search)

        const url = `${API_CONFIG.baseURL}/leaderboard?${params.toString()}`

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch ranking: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.success && data.data) {
          interface LeaderboardEntry {
            id: string
            rank: number | string
            firstName: string
            lastName: string
            email: string
            avatar: string | null
            submissionCount: number
            rankingPoint: number
          }

          const entries = data.data.entries.map(
            (entry: LeaderboardEntry): RankingUser => ({
              id: entry.id,
              rank:
                typeof entry.rank === 'string'
                  ? parseInt(entry.rank, 10)
                  : entry.rank,
              firstName: entry.firstName || '',
              lastName: entry.lastName || '',
              email: entry.email,
              avatar: entry.avatar || null,
              acceptedProblems: entry.submissionCount,
              totalSubmissions: entry.submissionCount,
              successRate: 0,
              rankingPoint: entry.rankingPoint,
              createdAt: new Date().toISOString(),
            })
          )

          setRanking(entries)
          setPagination({
            page: data.data.page,
            limit: data.data.limit,
            total: data.data.total,
            totalPages: data.data.totalPages,
            hasNextPage: data.data.hasNextPage,
          })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch ranking')
      } finally {
        setLoading(false)
      }
    }

    fetchRanking()
  }, [
    serializedFilters,
    filters.page,
    filters.limit,
    filters.search,
    currentUser?.id,
  ])

  const refetch = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit)
        params.append('limit', (filters.limit || 20).toString())
      if (filters.search) params.append('search', filters.search)

      const url = `${API_CONFIG.baseURL}/leaderboard?${params.toString()}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ranking: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.data) {
        interface LeaderboardEntry {
          id: string
          rank: number | string
          firstName: string
          lastName: string
          email: string
          avatar: string | null
          submissionCount: number
          rankingPoint: number
        }

        const entries = data.data.entries.map(
          (entry: LeaderboardEntry): RankingUser => ({
            id: entry.id,
            rank:
              typeof entry.rank === 'string'
                ? parseInt(entry.rank, 10)
                : entry.rank,
            firstName: entry.firstName || '',
            lastName: entry.lastName || '',
            email: entry.email,
            avatar: entry.avatar || null,
            acceptedProblems: entry.submissionCount,
            totalSubmissions: entry.submissionCount,
            successRate: 0,
            rankingPoint: entry.rankingPoint,
            createdAt: new Date().toISOString(),
          })
        )

        setRanking(entries)
        setPagination({
          page: data.data.page,
          limit: data.data.limit,
          total: data.data.total,
          totalPages: data.data.totalPages,
          hasNextPage: data.data.hasNextPage,
        })
      }
    } catch {
      // Keep existing ranking on refetch error
    }
  }

  return {
    ranking,
    userRank,
    loading,
    error,
    pagination,
    refetch,
  }
}
