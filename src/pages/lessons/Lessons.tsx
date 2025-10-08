import React from 'react'
import { Tabs, TabsContent } from '../../components/ui/Tabs'
import CategorySection from '../../components/ui/CategorySection'
import Header from '../../components/Layout/Header/header'
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
  const algorithmCourses = [
    {
      title: 'Algorithms & Data Structures for Beginners',
      description:
        'Learn the foundations of coding interviews with essential data structures and algorithms.',
      duration: '25 hours',
      difficulty: 'Medium' as const,
      image: algoBeginners,
      gradient: 'rgba(147, 51, 234, 0.1)',
    },
    {
      title: 'Advanced Algorithms',
      description:
        'Master every algorithm you would ever need for technical interviews and competitive programming.',
      duration: '30 hours',
      difficulty: 'Hard' as const,
      image: algoAdvanced,
      gradient: 'rgba(239, 68, 68, 0.1)',
    },
  ]

  const systemDesignCourses = [
    {
      title: 'System Design for Beginners',
      description:
        'Learn the foundations of system design interviews and building scalable applications.',
      duration: '15 hours',
      difficulty: 'Medium' as const,
      image: systemDesign,
      gradient: 'rgba(59, 130, 246, 0.1)',
    },
    {
      title: 'System Design Interview',
      description:
        'Practice common system design interview questions with real-world scenarios.',
      duration: '12 hours',
      difficulty: 'Medium' as const,
      image: systemInterview,
      gradient: 'rgba(6, 182, 212, 0.1)',
    },
  ]

  const fullStackCourses = [
    {
      title: 'Full Stack Development',
      description:
        'Build complete web applications from frontend to backend with modern technologies.',
      duration: '40 hours',
      difficulty: 'Medium' as const,
      image: fullstack,
      gradient: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Web Development Masterclass',
      description:
        'Master modern web development with React, TypeScript, and responsive design.',
      duration: '35 hours',
      difficulty: 'Easy' as const,
      image: webDev,
      gradient: 'rgba(168, 85, 247, 0.1)',
    },
  ]

  return (
    <div className="lessons-page">
      <Header />

      <div className="lessons-container">
        <div className="lessons-header">
          <h1 className="lessons-title">Lessons</h1>
          <p className="lessons-subtitle">
            Master coding interviews with structured learning paths
          </p>
        </div>

        <Tabs defaultValue="courses" className="w-full">
          <TabsContent value="courses" className="tabs-content">
            <CategorySection
              title="Data Structures & Algorithms"
              subtitle="Follow a structured path to learn all of the core data structures & algorithms. Perfect for coding interview preparation."
              courses={algorithmCourses}
            />

            <CategorySection
              title="System Design"
              subtitle="Brush up on core system design concepts for designing robust and scalable backend systems."
              courses={systemDesignCourses}
            />

            <CategorySection
              title="Full Stack Development"
              subtitle="Learn to build complete web applications with modern frameworks and best practices."
              courses={fullStackCourses}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Index
