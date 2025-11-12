import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { challengeService } from '../../services/api/challenge.service'

interface Challenge {
  id: string
  title: string
}

interface UseProblemNavigationProps {
  currentProblemId?: string
  topicId?: string
}

interface UseProblemNavigationReturn {
  topicChallenges: Challenge[]
  navigationLoading: boolean
  currentIndex: number
  prevId?: string
  nextId?: string
  hasPrev: boolean
  hasNext: boolean
  goPrev: () => void
  goNext: () => void
}

export const useProblemNavigation = ({
  currentProblemId,
  topicId,
}: UseProblemNavigationProps): UseProblemNavigationReturn => {
  const navigate = useNavigate()
  const [topicChallenges, setTopicChallenges] = useState<Challenge[]>([])
  const [navigationLoading, setNavigationLoading] = useState(false)

  // Load challenges in the same topic to enable prev/next navigation
  useEffect(() => {
    const loadTopicChallenges = async () => {
      if (!topicId) {
        setTopicChallenges([])
        setNavigationLoading(false)
        return
      }

      try {
        setNavigationLoading(true)
        const response = await challengeService.getChallengesByTopicId(topicId)

        // Response is guaranteed to be an array from service layer
        const mapped = response.map((item: { id: string; title: string }) => ({
          id: item.id,
          title: item.title,
        }))
        setTopicChallenges(mapped)
      } catch (error) {
        console.error('Error loading topic challenges:', error)
        setTopicChallenges([])
        // Optionally show a toast notification here
      } finally {
        setNavigationLoading(false)
      }
    }
    loadTopicChallenges()
  }, [topicId])

  const currentIndex = useMemo(() => {
    if (!currentProblemId) return -1
    return topicChallenges.findIndex(c => c.id === currentProblemId)
  }, [currentProblemId, topicChallenges])

  const prevId = useMemo(() => {
    return currentIndex > 0 ? topicChallenges[currentIndex - 1]?.id : undefined
  }, [currentIndex, topicChallenges])

  const nextId = useMemo(() => {
    return currentIndex >= 0 && currentIndex < topicChallenges.length - 1
      ? topicChallenges[currentIndex + 1]?.id
      : undefined
  }, [currentIndex, topicChallenges])

  const hasPrev = Boolean(prevId)
  const hasNext = Boolean(nextId)

  const goPrev = useCallback(() => {
    if (prevId && !navigationLoading) {
      const prevChallenge = topicChallenges.find(c => c.id === prevId)
      if (prevChallenge) {
        navigate(`/problems/${prevId}`, {
          state: {
            fromNavigation: true,
            challengeTitle: prevChallenge.title,
          },
        })
      }
    }
  }, [prevId, navigationLoading, topicChallenges, navigate])

  const goNext = useCallback(() => {
    if (nextId && !navigationLoading) {
      const nextChallenge = topicChallenges.find(c => c.id === nextId)
      if (nextChallenge) {
        navigate(`/problems/${nextId}`, {
          state: {
            fromNavigation: true,
            challengeTitle: nextChallenge.title,
          },
        })
      }
    }
  }, [nextId, navigationLoading, topicChallenges, navigate])

  return {
    topicChallenges,
    navigationLoading,
    currentIndex,
    prevId,
    nextId,
    hasPrev,
    hasNext,
    goPrev,
    goNext,
  }
}
