import { useState, useEffect, useMemo } from 'react'
import { rankingAPI } from '../../services/api/ranking.service'
import { RankingFilters, RankingUser } from '@/types/ranking.types'

export const useRanking = (filters: RankingFilters = {}) => {
  const [ranking, setRanking] = useState<RankingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
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

        // For now, we'll use mock data if the API doesn't exist
        // In production, this would call the actual API
        const mockRanking: RankingUser[] = [
          {
            id: '1',
            rank: 1,
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice@example.com',
            avatar: null,
            acceptedProblems: 45,
            totalSubmissions: 120,
            successRate: 87.5,
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            rank: 2,
            firstName: 'Bob',
            lastName: 'Smith',
            email: 'bob@example.com',
            avatar: null,
            acceptedProblems: 38,
            totalSubmissions: 95,
            successRate: 80.0,
            createdAt: new Date().toISOString(),
          },
          {
            id: '3',
            rank: 3,
            firstName: 'Charlie',
            lastName: 'Brown',
            email: 'charlie@example.com',
            avatar: null,
            acceptedProblems: 32,
            totalSubmissions: 88,
            successRate: 75.5,
            createdAt: new Date().toISOString(),
          },
          {
            id: '4',
            rank: 4,
            firstName: 'Diana',
            lastName: 'Martinez',
            email: 'diana@example.com',
            avatar: null,
            acceptedProblems: 28,
            totalSubmissions: 75,
            successRate: 72.0,
            createdAt: new Date().toISOString(),
          },
          {
            id: '5',
            rank: 5,
            firstName: 'Eve',
            lastName: 'Davis',
            email: 'eve@example.com',
            avatar: null,
            acceptedProblems: 25,
            totalSubmissions: 68,
            successRate: 68.5,
            createdAt: new Date().toISOString(),
          },
          {
            id: '6',
            rank: 6,
            firstName: 'Frank',
            lastName: 'Wilson',
            email: 'frank@example.com',
            avatar: null,
            acceptedProblems: 22,
            totalSubmissions: 62,
            successRate: 65.0,
            createdAt: new Date().toISOString(),
          },
          {
            id: '7',
            rank: 7,
            firstName: 'Grace',
            lastName: 'Miller',
            email: 'grace@example.com',
            avatar: null,
            acceptedProblems: 18,
            totalSubmissions: 55,
            successRate: 62.5,
            createdAt: new Date().toISOString(),
          },
          {
            id: '8',
            rank: 8,
            firstName: 'Henry',
            lastName: 'Anderson',
            email: 'henry@example.com',
            avatar: null,
            acceptedProblems: 15,
            totalSubmissions: 48,
            successRate: 60.0,
            createdAt: new Date().toISOString(),
          },
          {
            id: '9',
            rank: 9,
            firstName: 'Ivy',
            lastName: 'Taylor',
            email: 'ivy@example.com',
            avatar: null,
            acceptedProblems: 12,
            totalSubmissions: 42,
            successRate: 57.5,
            createdAt: new Date().toISOString(),
          },
          {
            id: '10',
            rank: 10,
            firstName: 'Jack',
            lastName: 'Thomas',
            email: 'jack@example.com',
            avatar: null,
            acceptedProblems: 10,
            totalSubmissions: 38,
            successRate: 55.0,
            createdAt: new Date().toISOString(),
          },
        ]

        // Try to fetch from API, but fall back to mock data if it fails
        try {
          const response = await rankingAPI.getRanking(filters)
          setRanking(response.data)
        } catch {
          setRanking(mockRanking)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch ranking')
      } finally {
        setLoading(false)
      }
    }
    fetchRanking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedFilters])

  const refetch = async () => {
    try {
      const response = await rankingAPI.getRanking(filters)
      setRanking(response.data)
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
