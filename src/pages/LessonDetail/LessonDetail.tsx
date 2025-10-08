import React from 'react'
import { FiClock } from 'react-icons/fi'
import YouTubePlayer from '../../components/ui/YouTubePlayer'
import './LessonDetail.css'

interface Lesson {
  id: string
  title: string
  videoId: string
  duration: string
  content: string
}

// Mock data - replace with actual data from your API
const mockLesson: Lesson = {
  id: '1',
  title: 'Introduction to the Course',
  videoId: 'dQw4w9WgXcQ',
  duration: '5:30',
  content: `
    <h2>Welcome to the Course</h2>
    <p>In this lesson, we'll cover the basic concepts and set up our development environment.</p>
    <ul>
      <li>Course overview</li>
      <li>What you'll learn</li>
      <li>Prerequisites</li>
    </ul>
    <div class="code-block">
      <div class="code-header">Example Code</div>
      <div class="code-content">
        <pre>
console.log('Welcome to the course!');
        </pre>
      </div>
    </div>
  `,
}

const LessonDetail: React.FC = () => {
  return (
    <div className="lesson-detail-page">
      <main className="lesson-main-content">
        <header className="lesson-header">
          <h1 className="lesson-title">{mockLesson.title}</h1>
          <div className="lesson-metadata">
            <div className="metadata-item">
              <FiClock />
              <span>{mockLesson.duration}</span>
            </div>
          </div>
        </header>

        {/* Video Player */}
        <div className="video-container">
          <YouTubePlayer videoId={mockLesson.videoId} />
        </div>

        {/* Lesson Content */}
        <div
          className="lesson-content"
          dangerouslySetInnerHTML={{ __html: mockLesson.content }}
        />
      </main>
    </div>
  )
}

export default LessonDetail
