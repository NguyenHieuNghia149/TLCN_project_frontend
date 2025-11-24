import React, { useRef, useState, useEffect } from 'react'
import { Clock, Star, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Course {
  id: string
  title: string
  description: string
  duration: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  image: string
  gradient: string
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

interface CategorySectionProps {
  title: string
  subtitle: string
  courses: Course[]
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  subtitle,
  courses,
}) => {
  const navigate = useNavigate()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)

  const handleStartLesson = (courseId: string) => {
    navigate(`/lessons/${courseId}`)
  }

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current
      setShowLeftButton(scrollLeft > 0)
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 5)
    }
  }

  useEffect(() => {
    checkScrollButtons()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollButtons)
      return () => container.removeEventListener('scroll', checkScrollButtons)
    }
  }, [courses])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400 // pixels to scroll
      const targetScroll =
        direction === 'left'
          ? scrollContainerRef.current.scrollLeft - scrollAmount
          : scrollContainerRef.current.scrollLeft + scrollAmount

      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      })
    }
  }

  /* const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-500 bg-green-500/10';
      case 'Medium':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'Hard':
        return 'text-red-500 bg-red-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';s
    }
  };*/

  return (
    <div className="category-section">
      <div className="category-header">
        <h2 className="category-title">{title}</h2>
        <p className="category-subtitle">{subtitle}</p>
      </div>

      <div className="courses-slider-container">
        {showLeftButton && (
          <button
            className="scroll-button scroll-button-left"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div className="courses-grid" ref={scrollContainerRef}>
          {courses.map((course, index) => (
            <div key={index} className="course-card">
              <div className="course-image">
                <div
                  className="course-image-bg"
                  style={{ backgroundImage: `url(${course.image})` }}
                />
                <div className="course-image-overlay" />
                <div
                  className={`course-difficulty difficulty-${course.difficulty.toLowerCase()}`}
                >
                  {course.difficulty}
                </div>
                <div className="course-duration">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
                {course.onToggleFavorite && (
                  <button
                    className="course-favorite-button"
                    onClick={e => {
                      e.preventDefault()
                      course.onToggleFavorite?.()
                    }}
                    title={
                      course.isFavorite
                        ? 'Remove from favorites'
                        : 'Add to favorites'
                    }
                  >
                    <Star
                      className="h-5 w-5"
                      fill={course.isFavorite ? 'currentColor' : 'none'}
                      color={course.isFavorite ? '#FFD700' : 'white'}
                    />
                  </button>
                )}
              </div>

              <div className="course-content">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-description">{course.description}</p>

                <div className="course-footer">
                  <button
                    className="course-button"
                    onClick={() => handleStartLesson(course.id)}
                  >
                    <Play className="h-4 w-4" />
                    <span>Start Lesson</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showRightButton && (
          <button
            className="scroll-button scroll-button-right"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  )
}

export default CategorySection
