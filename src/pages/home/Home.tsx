import React, { useEffect, useMemo, useState } from 'react'
import {
  Database,
  Code2,
  Server,
  Layers,
  Hash,
  BarChart3,
  Brain,
  Terminal,
  FileCode,
  Diamond,
  Workflow,
  Atom,
  ChevronRight,
  Clock,
  Lock,
  BookOpen,
} from 'lucide-react'
import './Home.scss'
import 'tailwindcss/tailwind.css'
import SkillCard from '@/components/common/SkillCard'
import { TopicService } from '@/services/api/topic.service'
import {
  LearningProcessService,
  TopicProgress,
  LessonProgress,
} from '@/services/api/learningprocess.service'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/stores'

// const ProgressCard: React.FC<ProgressCardProps> = ({
//   title,
//   subtitle,
//   progress,
//   total,
//   icon,
//   showArrow = true
// }) => {
//   const percentage = Math.round((progress / total) * 100);

//   return (
//     <div className="bg-gray-800 rounded-lg p-6 relative group hover:bg-gray-750 transition-colors">
//       <div className="flex items-center gap-3 mb-4">
//         {icon}
//         <h3 className="text-white font-medium">{title}</h3>
//       </div>

//       <div className="mb-3">
//         <div className="w-full bg-gray-700 rounded-full h-2">
//           <div
//             className="bg-green-500 h-2 rounded-full transition-all duration-500"
//             style={{ width: `${percentage}%` }}
//           ></div>
//         </div>
//       </div>

//       <p className="text-gray-400 text-sm">
//         {percentage}% ({progress}/{total} {subtitle})
//       </p>

//       {showArrow && (
//               <div className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center">
//                 <ChevronRight

//                   className="w-full h-full object-cover rounded"
//                 />
//               </div>
//       )}
//     </div>
//   );
// };

// interface InterviewCardProps {
//   title: string;
//   subtitle: string;
//   duration: string;
//   buttonText?: string;
//   buttonVariant?: 'primary' | 'secondary';
//   isLocked?: boolean;
// }

// interface SkillCardProps {
//   title: string
//   icon: React.ReactNode
// }

// const SkillCard: React.FC<SkillCardProps> = ({ title, icon }) => {
//   return (
//     <div className="practice-skill-card cursor-pointer">
//       <div className="practice-skill-card__row">
//         <div className="practice-skill-card__icon">{icon}</div>
//         <span className="practice-skill-card__title">{title}</span>
//       </div>
//     </div>
//   )
//}

// New Continue Practice Card Component
interface ContinuePracticeCardProps {
  title: string
  progress: number
  total: number
  subtitle: string
  icon: React.ReactNode
  onClick?: () => void
}

const ContinuePracticeCard: React.FC<ContinuePracticeCardProps> = ({
  title,
  progress,
  total,
  subtitle,
  icon,
  onClick,
}) => {
  const percentage = Math.round((progress / total) * 100)

  return (
    <div
      className="continue-practice-card group relative h-[208px] cursor-pointer rounded-xl border border-border bg-card p-6 pr-16 transition-all duration-300 hover:bg-secondary"
      onClick={onClick}
    >
      <div className="continue-practice-card-content">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-card">
            {icon}
          </div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-2 w-[400px] rounded-full bg-gray-600">
            <div
              className="h-2 rounded-full bg-green-500 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Progress text */}

        <div className="continue-practice-card-percentage flex items-center gap-2 text-muted-foreground">
          <p>{percentage}%</p>
          <p className="continue-practice-card-subtitle">
            ({progress}/{total} {subtitle})
          </p>
        </div>
      </div>

      {/* Arrow button */}
      <div className="continue-practice-card-arrowBtn absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center">
        <ChevronRight className="h-6 w-6 rounded object-cover" />
      </div>
    </div>
  )
}

interface TopicItem {
  id: string
  topicName: string
}

const HomePage: React.FC = () => {
  const [topics, setTopics] = useState<TopicItem[]>([])
  const [isLoadingTopics, setIsLoadingTopics] = useState<boolean>(false)
  const [recentTopicProgress, setRecentTopicProgress] =
    useState<TopicProgress | null>(null)
  const [recentLessonProgress, setRecentLessonProgress] =
    useState<LessonProgress | null>(null)
  const [isLoadingProgress, setIsLoadingProgress] = useState<boolean>(false)
  const navigate = useNavigate()
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.session.isAuthenticated
  )

  useEffect(() => {
    let isMounted = true
    const svc = new TopicService()

    setIsLoadingTopics(true)

    svc
      .getTopics()
      .then(data => {
        if (!isMounted) return
        setTopics(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!isMounted) return
        setTopics([])
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoadingTopics(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Fetch learning progress only when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setRecentTopicProgress(null)
      setRecentLessonProgress(null)
      setIsLoadingProgress(false)
      return
    }

    let isMounted = true
    const progressSvc = new LearningProcessService()

    setIsLoadingProgress(true)

    // Fetch recent topic progress
    progressSvc
      .getRecentTopic()
      .then(data => {
        if (!isMounted) return
        setRecentTopicProgress(data)
      })
      .catch(() => {
        if (!isMounted) return
        setRecentTopicProgress(null)
      })

    // Fetch recent lesson progress
    progressSvc
      .getRecentLesson()
      .then(data => {
        if (!isMounted) return
        setRecentLessonProgress(data)
      })
      .catch(() => {
        if (!isMounted) return
        setRecentLessonProgress(null)
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoadingProgress(false)
      })

    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  const iconForTopic = useMemo(() => {
    const mapping: Record<string, React.ReactNode> = {
      Algorithms: <Hash size={20} />,
      'Data Structures': <BarChart3 size={20} />,
      Mathematics: <Hash size={20} />,
      'Artificial Intelligence': <Brain size={20} />,
      C: <FileCode size={20} />,
      'C++': <Code2 size={20} />,
      Java: <Atom size={20} />,
      Python: <Terminal size={20} />,
      Ruby: <Diamond size={20} />,
      SQL: <Database size={20} />,
      Databases: <Server size={20} />,
      'Linux Shell': <Terminal size={20} />,
      'Functional Programming': <Workflow size={20} />,
      Regex: <Hash size={20} />,
      React: <Atom size={20} />,
      'Dynamic Programming': <Workflow size={20} />,
    }
    return (name: string) => mapping[name] ?? <Hash size={20} />
  }, [])

  return (
    <div className="home-page min-h-full bg-background text-foreground">
      <div className="mx-auto max-w-7xl p-6">
        {/* Continue Practicing Section - Updated Design */}
        {isAuthenticated &&
          !isLoadingProgress &&
          (recentTopicProgress || recentLessonProgress) && (
            <div className="mb-12 mt-12">
              <h2 className="mb-6 text-2xl font-semibold text-foreground">
                Continue Practicing
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {recentTopicProgress && (
                  <ContinuePracticeCard
                    title={recentTopicProgress.topicName}
                    progress={recentTopicProgress.solvedProblems}
                    total={recentTopicProgress.totalProblems}
                    subtitle="challenges solved"
                    icon={<Database className="text-gray-800" size={20} />}
                    onClick={() =>
                      navigate(
                        `/dashboard/challenge/${recentTopicProgress.topicId}?category=${encodeURIComponent(
                          recentTopicProgress.topicName
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                        )}`
                      )
                    }
                  />
                )}

                {recentLessonProgress && (
                  <ContinuePracticeCard
                    title={recentLessonProgress.topicName}
                    progress={recentLessonProgress.completedLessons}
                    total={recentLessonProgress.totalLessons}
                    subtitle="lessons completed"
                    icon={<BookOpen className="text-gray-800" size={20} />}
                    onClick={() => navigate('/lessons')}
                  />
                )}
              </div>
            </div>
          )}

        {/* Programming Courses Section */}
        <div className="mb-12 mt-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">
                Programming Fundamentals
              </h2>
              <span className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1 text-xs font-medium text-white">
                New
              </span>
            </div>
            <button className="flex items-center gap-1 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300">
              Explore All Courses
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="programming-card group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300">
              <div className="relative z-10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 transition-colors group-hover:bg-green-500/20">
                  <Code2 className="text-green-400" size={24} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Programming Basics
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Learn fundamental programming concepts and problem-solving
                  techniques
                </p>

                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={16} />
                  <span>8 hours • 25 lessons</span>
                </div>

                <button className="hover:border-tra w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/25">
                  Try for free
                </button>
              </div>
            </div>

            <div className="programming-card group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300">
              <div className="relative z-10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                  <BarChart3 className="text-blue-400" size={24} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Data Structures
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Master arrays, linked lists, stacks, queues and tree
                  structures
                </p>

                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={16} />
                  <span>12 hours • 32 lessons</span>
                </div>

                <div className="flex items-center justify-center py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Lock size={16} />
                    <span className="text-sm">Complete Programming Basics</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="programming-card group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300">
              <div className="relative z-10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 transition-colors group-hover:bg-purple-500/20">
                  <Hash className="text-purple-400" size={24} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  Algorithms
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Learn sorting, searching algorithms and complexity analysis
                </p>

                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={16} />
                  <span>15 hours • 28 lessons</span>
                </div>

                <div className="flex items-center justify-center py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Lock size={16} />
                    <span className="text-sm">Complete Data Structures</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="programming-card group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300">
              <div className="relative z-10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 transition-colors group-hover:bg-orange-500/20">
                  <Layers className="text-orange-400" size={24} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  OOP Concepts
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Object-oriented programming principles and design patterns
                </p>

                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={16} />
                  <span>10 hours • 20 lessons</span>
                </div>

                <div className="flex items-center justify-center py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Lock size={16} />
                    <span className="text-sm">Complete Algorithms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Progress Overview */}
          <div className="mt-6 rounded-xl border border-border bg-card/50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Your Learning Path
              </h3>
              <div className="text-sm text-gray-400">
                1 / 4 courses completed
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary">
              <div className="h-2 w-1/4 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"></div>
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span className="font-medium text-green-400">
                Programming Basics ✓
              </span>
              <span className="text-muted-foreground">
                Complete all courses to unlock advanced topics
              </span>
            </div>
          </div>
        </div>

        {/* Practice Skills */}
        <div className="mb-12 mt-12">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            Practice Skills
          </h2>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4">
            {isLoadingTopics && (
              <div className="col-span-2 text-gray-400 md:col-span-4">
                Loading topics...
              </div>
            )}
            {!isLoadingTopics && topics.length === 0 && (
              <div className="col-span-2 text-gray-400 md:col-span-4">
                No topics available.
              </div>
            )}
            {!isLoadingTopics &&
              topics.map(topic => (
                <SkillCard
                  key={topic.id}
                  title={topic.topicName}
                  icon={iconForTopic(topic.topicName)}
                  onClick={() =>
                    navigate(
                      `/dashboard/challenge/${topic.id}?category=${encodeURIComponent(
                        topic.topicName.toLowerCase().replace(/\s+/g, '-')
                      )}`
                    )
                  }
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
