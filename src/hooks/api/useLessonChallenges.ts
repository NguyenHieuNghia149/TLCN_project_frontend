import { useState, useEffect } from 'react'
import { challengeService } from '@/services/api/challenge.service'
import { ChallengeItem } from '@/types/challenge.types'

interface UseLessonChallengesResult {
  challenges: ChallengeItem[]
  loading: boolean
  error: string | null
}

export const useLessonChallenges = (
  topicId: string
): UseLessonChallengesResult => {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!topicId) {
      setChallenges([])
      setError(null)
      return
    }

    const fetchChallenges = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch first 3 challenges
        const response = await challengeService.getChallengesByTopicId(
          topicId,
          3
        )

        if (response.items && response.items.length > 0) {
          setChallenges(response.items)
        } else {
          setChallenges([])
        }
      } catch (err) {
        console.error('Error fetching challenges for lesson:', err)
        setError(
          err instanceof Error ? err.message : 'Failed to load challenges'
        )
        setChallenges([])
      } finally {
        setLoading(false)
      }
    }

    fetchChallenges()
  }, [topicId])

  return { challenges, loading, error }
}
