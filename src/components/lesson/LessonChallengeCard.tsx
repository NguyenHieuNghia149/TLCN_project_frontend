import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { ChallengeItem } from '@/types/challenge.types'
import { favoritesService } from '@/services/api/favorites.service'

interface Props {
  challenge: ChallengeItem
  onFavoriteToggle?: (challengeId: string, isFavorite: boolean) => void
}

const difficultyColor: Record<string, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
}

const difficultyBgColor: Record<string, string> = {
  easy: 'bg-green-400/10',
  medium: 'bg-yellow-400/10',
  hard: 'bg-red-400/10',
}

const LessonChallengeCard: React.FC<Props> = ({
  challenge,
  onFavoriteToggle,
}) => {
  const navigate = useNavigate()
  const [isFavorite, setIsFavorite] = useState(challenge.isFavorite ?? false)
  const [isToggling, setIsToggling] = useState(false)

  const handleSolveChallenge = () => {
    navigate(`/problems/${challenge.id}`)
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isToggling) return

    setIsToggling(true)
    try {
      const response = await favoritesService.toggleFavorite(challenge.id)
      const newFavoriteStatus = response.data.isFavorite
      setIsFavorite(newFavoriteStatus)
      onFavoriteToggle?.(challenge.id, newFavoriteStatus)
    } catch (error) {
      console.error('Error toggling favorite:', error)
      setIsFavorite(!isFavorite)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/50 hover:bg-accent/10">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {challenge.title}
          </h3>
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`inline-block px-2 py-1 text-xs font-medium ${difficultyColor[challenge.difficulty]} ${difficultyBgColor[challenge.difficulty]} rounded`}
            >
              {challenge.difficulty}
            </span>
            {challenge.totalPoints > 0 && (
              <span className="text-xs text-muted-foreground">
                Max Score: {challenge.totalPoints}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleToggleFavorite}
          disabled={isToggling}
          aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
          title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          className="rounded p-1.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Star
            className={`h-5 w-5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
          />
        </button>
      </div>

      <button
        onClick={handleSolveChallenge}
        className="w-full rounded-lg bg-green-500 px-4 py-2 font-medium text-white transition-colors hover:bg-green-600 active:bg-green-700"
      >
        Solve Challenge
      </button>
    </div>
  )
}

export default LessonChallengeCard
