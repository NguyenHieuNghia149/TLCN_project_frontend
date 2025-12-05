import { useState, useEffect, useMemo } from 'react'
import { API_CONFIG } from '@/config/api.config'
import type { RankingFilters, RankingUser } from '@/types/ranking.types'

export const useLeaderboard = (filters: RankingFilters = {}) => {
  const [ranking, setRanking] = useState<RankingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
  })

  const serializedFilters = useMemo(
    () => JSON.stringify(filters ?? {}),
    [filters]
  )

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        setError(null)

        // Build query parameters from filters
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
          throw new Error(`Failed to fetch leaderboard: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.success && data.data) {
          // Transform backend response to frontend format
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
              acceptedProblems: entry.submissionCount, // Map submission count to acceptedProblems
              totalSubmissions: entry.submissionCount,
              successRate: 0, // Will be calculated if needed
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
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch leaderboard'
        )
        setRanking([])
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [serializedFilters, filters.page, filters.limit, filters.search])

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
        throw new Error(`Failed to fetch leaderboard: ${response.statusText}`)
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
    loading,
    error,
    pagination,
    refetch,
  }
}
