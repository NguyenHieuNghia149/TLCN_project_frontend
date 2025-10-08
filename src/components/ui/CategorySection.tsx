import React from 'react'
import { Clock, Star, Play } from 'lucide-react'

interface Course {
  title: string
  description: string
  duration: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  image: string
  gradient: string
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

      <div className="courses-grid">
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
            </div>

            <div className="course-content">
              <h3 className="course-title">{course.title}</h3>
              <p className="course-description">{course.description}</p>

              <div className="course-footer">
                <div className="course-rating">
                  <Star className="h-4 w-4" />
                  <span>4.8</span>
                  <span>(1,234 reviews)</span>
                </div>

                <button className="course-button">
                  <Play className="h-4 w-4" />
                  <span>Start Lesson</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CategorySection
