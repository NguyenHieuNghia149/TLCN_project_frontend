import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Star } from 'lucide-react'
import { Challenge } from '@/types/challenge.types'
import { favoritesService } from '@/services/api/favorites.service'

interface Props {
  challenge: Challenge
  onFavoriteToggle?: (challengeId: string, isFavorite: boolean) => void
}

const difficultyColor: Record<Challenge['difficulty'], string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
}

const ChallengeCard: React.FC<Props> = ({ challenge, onFavoriteToggle }) => {
  const navigate = useNavigate()
  const [isFavorite, setIsFavorite] = useState(challenge.isFavorite ?? false)
  const [isToggling, setIsToggling] = useState(false)

  const goToDetail = () => navigate(`/problems/${challenge.id}`)

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
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80 hover:bg-accent/10 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="mb-1 text-lg font-semibold text-foreground">
            {challenge.title}
          </h3>
          <div className="mb-3 flex items-center gap-3 text-[12px]">
            <span className={difficultyColor[challenge.difficulty]}>
              {challenge.difficulty}
            </span>
            {typeof challenge.totalPoints === 'number' && (
              <span className="text-muted-foreground">
                Max Score: {challenge.totalPoints}
              </span>
            )}
            <span className="text-muted-foreground">{challenge.topic}</span>
          </div>
        </div>

        <div className="ml-2 flex items-center gap-3">
          <button
            onClick={handleToggleFavorite}
            disabled={isToggling}
            aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
            title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            className="rounded p-1.5 transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              className={
                isFavorite ? 'text-yellow-400' : 'text-muted-foreground'
              }
            >
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </span>
          </button>

          {challenge.isSolved && (
            <button
              onClick={goToDetail}
              className="inline-flex h-[36px] w-[150px] items-center justify-center rounded border border-border bg-secondary text-[14px] font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-default disabled:opacity-90"
            >
              <Check className="mr-2 h-4 w-4" />
              Solved
            </button>
          )}

          {!challenge.isSolved && (
            <button
              onClick={goToDetail}
              className="inline-flex h-[36px] w-[150px] items-center justify-center rounded border border-transparent bg-primary text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-default disabled:opacity-90"
            >
              Solve Challenge
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChallengeCard
