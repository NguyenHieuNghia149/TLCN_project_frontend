import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Tabs, TabsContent } from '../../components/ui/Tabs'
import CategorySection from '../../components/ui/CategorySection'
import { useLessons } from '../../hooks/api/useLessons'
import { favoritesService } from '../../services/api/favorites.service'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { createHtmlPreview } from '../../utils/htmlUtils'
import '../../pages/lessons/Lessons.css'

// Placeholder images - replace with actual imports when available
const algoBeginners =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop'
const algoAdvanced =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop'
const systemDesign =
  'https://images.unsplash.com/photo-1461749280684-dccba6e6d3c1?w=400&h=300&fit=crop'
const systemInterview =
  'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop'
const fullstack =
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop'
const webDev =
  'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop'

const Index = () => {
  const location = useLocation()
  const [selectedTopic] = useState<string>('')
  const [showFavorites, setShowFavorites] = useState<boolean>(false)
  const { lessons, loading, error } = useLessons({ topicId: selectedTopic })
  const [favoritesMap, setFavoritesMap] = useState<Record<string, boolean>>({})

  // Sync server-provided favorite status when lessons load
  useEffect(() => {
    if (lessons && lessons.length > 0) {
      const initialFavoritesMap = lessons.reduce(
        (acc, lesson) => {
          acc[lesson.id] = lesson.isFavorite ?? false
          return acc
        },
        {} as Record<string, boolean>
      )
      setFavoritesMap(initialFavoritesMap)
    }
  }, [lessons])

  // Trigger refetch when location changes (navigating back to page)
  useEffect(() => {
    // This forces the hook to refetch data
  }, [location.pathname])

  const handleToggleFavorite = useCallback(
    async (lessonId: string) => {
      const currentFavoriteStatus =
        favoritesMap[lessonId] ??
        lessons?.find(l => l.id === lessonId)?.isFavorite ??
        false

      // Optimistic update
      setFavoritesMap(prev => ({
        ...prev,
        [lessonId]: !currentFavoriteStatus,
      }))

      try {
        const response = await favoritesService.toggleLessonFavorite(lessonId)
        // Update with actual response
        setFavoritesMap(prev => ({
          ...prev,
          [lessonId]: response.data.isFavorite,
        }))
      } catch (err) {
        console.error('Error toggling favorite:', err)
        // Revert on error
        setFavoritesMap(prev => ({
          ...prev,
          [lessonId]: currentFavoriteStatus,
        }))
      }
    },
    [favoritesMap, lessons]
  )

  // Group lessons by topic
  const groupedLessons = useMemo(() => {
    return (lessons || []).reduce(
      (acc, lesson) => {
        const topicName = lesson.topicName || 'Other'
        if (!acc[topicName]) {
          acc[topicName] = []
        }
        acc[topicName].push(lesson)
        return acc
      },
      {} as Record<string, typeof lessons>
    )
  }, [lessons])

  // Filter lessons based on showFavorites
  const filteredLessons = useMemo(() => {
    if (!showFavorites) {
      return groupedLessons
    }

    // Filter each topic's lessons to only show favorites
    const filtered: Record<string, typeof lessons> = {}
    Object.entries(groupedLessons).forEach(([topicName, topicLessons]) => {
      const favorited = topicLessons.filter(lesson =>
        favoritesMap[lesson.id] !== undefined
          ? favoritesMap[lesson.id]
          : lesson.isFavorite
      )
      if (favorited.length > 0) {
        filtered[topicName] = favorited
      }
    })
    return filtered
  }, [groupedLessons, showFavorites, favoritesMap])

  // Convert lessons to course format for CategorySection
  const convertLessonsToCourses = (
    lessonsData: typeof lessons,
    topicId?: string
  ) => {
    return lessonsData.map((lesson, index) => ({
      id: lesson.id,
      title: lesson.title,
      description: createHtmlPreview(lesson.content || '', 120),
      duration: '1 hour',
      difficulty: 'Medium' as const,
      image: [
        algoBeginners,
        algoAdvanced,
        systemDesign,
        systemInterview,
        fullstack,
        webDev,
      ][index % 6],
      gradient: [
        'rgba(147, 51, 234, 0.1)',
        'rgba(239, 68, 68, 0.1)',
        'rgba(59, 130, 246, 0.1)',
        'rgba(6, 182, 212, 0.1)',
        'rgba(16, 185, 129, 0.1)',
        'rgba(168, 85, 247, 0.1)',
      ][index % 6],
      topicId,
      isFavorite:
        favoritesMap[lesson.id] !== undefined
          ? favoritesMap[lesson.id]
          : (lesson.isFavorite ?? false),
      onToggleFavorite: () => handleToggleFavorite(lesson.id),
    }))
  }

  if (loading) {
    return (
      <div className="lessons-page">
        <div className="lessons-container">
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="lessons-page">
        <div className="lessons-container">
          <div className="py-8 text-center">
            <h2 className="mb-2 text-xl font-semibold text-red-600">
              Error Loading Lessons
            </h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="lessons-page">
      <div className="lessons-container">
        <div className="lessons-header">
          <h1 className="lessons-title">Lessons</h1>
          <p className="lessons-subtitle">
            Master coding interviews with structured learning paths
          </p>
        </div>

        <Tabs defaultValue="courses" className="w-full">
          <TabsContent value="courses" className="tabs-content">
            {/* Favorites Filter */}
            <div className="mb-6 flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={showFavorites}
                  onChange={e => setShowFavorites(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-700 bg-gray-800 text-yellow-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">
                  Show Favorites Only
                </span>
              </label>
            </div>

            {Object.keys(filteredLessons).length === 0 ? (
              <div className="py-8 text-center">
                <h2 className="mb-2 text-xl font-semibold text-gray-600">
                  {showFavorites
                    ? 'No Favorite Lessons'
                    : 'No Lessons Available'}
                </h2>
                <p className="text-gray-500">
                  {showFavorites
                    ? "You haven't favorited any lessons yet."
                    : 'There are no lessons in the database yet.'}
                </p>
              </div>
            ) : (
              Object.entries(filteredLessons).map(
                ([topicName, topicLessons]) => {
                  // Get topicId from first lesson
                  const topicId = topicLessons[0]?.topicId
                  return (
                    <CategorySection
                      key={topicName}
                      title={topicName}
                      subtitle={`Learn about ${topicName.toLowerCase()} with structured lessons.`}
                      courses={convertLessonsToCourses(topicLessons, topicId)}
                      topicId={topicId}
                    />
                  )
                }
              )
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Index
