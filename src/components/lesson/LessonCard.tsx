import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, BookOpen, Check } from 'lucide-react'
import { Lesson } from '@/types/lesson.types'
import { favoritesService } from '@/services/api/favorites.service'

interface Props {
  lesson: Lesson
  onFavoriteToggle?: (lessonId: string, isFavorite: boolean) => void
}

const LessonCard: React.FC<Props> = ({ lesson, onFavoriteToggle }) => {
  const navigate = useNavigate()
  const [isFavorite, setIsFavorite] = useState(lesson.isFavorite ?? false)
  const [isToggling, setIsToggling] = useState(false)
  const [isLearned, setIsLearned] = useState(lesson.isLearned ?? false)

  // Sync prop to state whenever lesson.isFavorite changes
  useEffect(() => {
    setIsFavorite(lesson.isFavorite ?? false)
  }, [lesson.isFavorite])

  // Sync learned status
  useEffect(() => {
    setIsLearned(lesson.isLearned ?? false)
  }, [lesson.isLearned])

  const goToDetail = () => navigate(`/lessons/${lesson.id}`)

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isToggling) return

    setIsToggling(true)
    try {
      const response = await favoritesService.toggleLessonFavorite(lesson.id)
      const newFavoriteStatus = response.data.isFavorite
      setIsFavorite(newFavoriteStatus)
      onFavoriteToggle?.(lesson.id, newFavoriteStatus)
    } catch (error) {
      console.error('Error toggling favorite:', error)
      // Revert on error
      setIsFavorite(!isFavorite)
    } finally {
      setIsToggling(false)
    }
  }

  const truncateContent = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text
    return (
      text
        .substring(0, maxLength)
        .replace(/<[^>]*>/g, '')
        .trim() + '...'
    )
  }

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isLearned
          ? 'border-green-500/30 bg-green-50/5 hover:border-green-500/50 hover:bg-green-50/10'
          : 'border-border bg-card hover:border-primary/50 hover:bg-accent/10'
      } p-5`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              {lesson.title}
            </h3>
            {isLearned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-600">
                <Check className="h-3 w-3" />
                Learned
              </span>
            )}
          </div>
          <div className="mb-3 flex items-center gap-3 text-[12px]">
            <span className="text-blue-400">
              {lesson.topicName || 'General'}
            </span>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {truncateContent(lesson.content ?? '')}
          </p>
        </div>

        <div className="ml-2 flex items-center gap-3">
          <button
            onClick={handleToggleFavorite}
            disabled={isToggling}
            aria-label={isFavorite ? 'Unfavorite' : 'Favorite'}
            title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            className="rounded p-1.5 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              className={
                isFavorite ? 'text-yellow-400' : 'text-muted-foreground'
              }
            >
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </span>
          </button>

          <button
            onClick={goToDetail}
            className={`inline-flex h-[36px] w-[150px] items-center justify-center rounded border text-[14px] font-medium transition-colors ${
              isLearned
                ? 'border-green-500/50 bg-green-500/10 text-green-600 hover:border-green-500 hover:bg-green-500/20'
                : 'border-blue-500 bg-blue-500 text-white hover:border-transparent hover:bg-blue-600'
            } disabled:cursor-default disabled:opacity-90`}
          >
            {isLearned ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Learned
              </>
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4" />
                Learn
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LessonCard
