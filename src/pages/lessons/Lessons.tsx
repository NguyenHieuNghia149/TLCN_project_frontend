import React, { useState } from 'react'
import { Tabs, TabsContent } from '../../components/ui/Tabs'
import CategorySection from '../../components/ui/CategorySection'
import { useLessons } from '../../hooks/api/useLessons'
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
  const [selectedTopic] = useState<string>('')
  const { lessons, loading, error } = useLessons({ topicId: selectedTopic })

  // Group lessons by topic
  const groupedLessons = (lessons || []).reduce(
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

  // Convert lessons to course format for CategorySection
  const convertLessonsToCourses = (lessonsData: typeof lessons) => {
    return lessonsData.map((lesson, index) => ({
      id: lesson.id,
      title: lesson.title,
      description: createHtmlPreview(lesson.content || '', 120), // Limit to 120 characters
      duration: '1 hour', // Default duration since it's not in the database
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
            {Object.keys(groupedLessons).length === 0 ? (
              <div className="py-8 text-center">
                <h2 className="mb-2 text-xl font-semibold text-gray-600">
                  No Lessons Available
                </h2>
                <p className="text-gray-500">
                  There are no lessons in the database yet.
                </p>
              </div>
            ) : (
              Object.entries(groupedLessons).map(
                ([topicName, topicLessons]) => (
                  <CategorySection
                    key={topicName}
                    title={topicName}
                    subtitle={`Learn about ${topicName.toLowerCase()} with structured lessons.`}
                    courses={convertLessonsToCourses(topicLessons)}
                  />
                )
              )
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Index
