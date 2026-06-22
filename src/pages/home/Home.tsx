import React, { useEffect, useMemo, useState } from 'react'
import {
  Database,
  Code2,
  Server,
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
  Play,
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
import { roadmapService } from '@/services/api/roadmap.service'
import {
  hasRenderableLessonProgress,
  hasRenderableTopicProgress,
} from './homeContinuePractice'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '@/store/stores'
import { asyncFetchUserRoadmaps } from '@/store/slices/roadmapSlice'
import { useTheme } from '@/contexts/useTheme'
import type {
  Roadmap,
  ProgressStats,
  RoadmapDetail,
} from '@/types/roadmap.types'

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
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0

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

        <div className="continue-practice-card-percentage flex items-center gap-2 text-foreground">
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

interface RoadmapCardProps {
  roadmap: Roadmap
  progress: ProgressStats | null
  isLocked: boolean
  onRoadmapClick: (roadmapId: string) => void
  icon?: React.ReactNode
  roadmapDetail?: RoadmapDetail | null
}

const ContinueRoadmapCard: React.FC<RoadmapCardProps> = ({
  roadmap,
  progress,
  onRoadmapClick,
  roadmapDetail,
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const percentage = progress?.percentage ?? 0
  const total = progress?.total ?? 0
  const completed = progress?.completed ?? 0
  const completedItems = progress?.completedItems ?? []

  // Calculate lesson and problem counts
  const lessonCount =
    roadmapDetail?.items?.filter(item => item.itemType === 'lesson').length ?? 0
  const problemCount =
    roadmapDetail?.items?.filter(item => item.itemType === 'problem').length ??
    0

  // Get current item (next incomplete item)
  const currentItem = roadmapDetail?.items?.find(
    item => !completedItems.includes(item.id)
  )
  const currentItemTitle = currentItem?.itemTitle ?? 'Next item'

  const getRoadmapIcon = (title: string): React.ReactNode => {
    if (title.toLowerCase().includes('c++')) {
      return (
        <svg
          className="h-20 w-20"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Hexagonal background */}
          <defs>
            <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
          </defs>
          <path
            d="M50 10 L85 32 L85 76 L50 98 L15 76 L15 32 Z"
            fill="url(#hexGrad)"
          />
          {/* C++ text */}
          <text
            x="50"
            y="60"
            textAnchor="middle"
            fontSize="48"
            fontWeight="bold"
            fill="white"
            fontFamily="Arial, sans-serif"
          >
            C++
          </text>
        </svg>
      )
    }
    if (title.toLowerCase().includes('algorithm')) {
      return (
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600">
          <Hash className="text-white" size={40} />
        </div>
      )
    }
    if (title.toLowerCase().includes('data')) {
      return (
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600">
          <BarChart3 className="text-white" size={40} />
        </div>
      )
    }
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600">
        <Code2 className="text-white" size={40} />
      </div>
    )
  }

  return (
    <div
      className={`continue-roadmap-card rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${
        isDark
          ? 'border-slate-700/50 bg-slate-900/80'
          : 'border-slate-200/50 bg-white/80'
      }`}
    >
      <div className="flex items-center gap-6">
        {/* Left side: Icon with progress circle */}
        <div className="relative flex flex-shrink-0 flex-col items-center">
          {getRoadmapIcon(roadmap.title)}
          {/* Progress circle */}
          <div
            className={`absolute -bottom-2 -right-2 flex h-14 w-14 items-center justify-center rounded-full border-4 border-green-500 ${
              isDark ? 'bg-slate-900' : 'bg-white'
            }`}
          >
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-green-400">
                {percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Left-middle: Title and info */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h3
              className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              {roadmap.title}
            </h3>
            <span
              className={`rounded border px-3 py-1 text-xs font-medium ${
                isDark
                  ? 'border-blue-500/50 bg-blue-500/30 text-blue-300'
                  : 'border-blue-300/50 bg-blue-100/50 text-blue-700'
              }`}
            >
              Basic
            </span>
          </div>

          {/* Progress text */}
          <div
            className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
          >
            <span className="font-semibold text-green-400">
              {completed}/{total}
            </span>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              {' '}
              items completed
            </span>
          </div>

          {/* Details */}
          <div
            className={`flex items-center gap-3 text-xs ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <span>{lessonCount} lessons</span>
            <span>•</span>
            <span>{problemCount} problems</span>
          </div>
        </div>

        {/* Middle: Current item info */}
        <div
          className={`hidden flex-col gap-1 border-l px-6 lg:flex ${
            isDark ? 'border-slate-700/50' : 'border-slate-200/50'
          }`}
        >
          <div
            className={`text-xs ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Current item
          </div>
          <div
            className={`text-sm font-semibold ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {currentItemTitle}
          </div>
        </div>

        {/* Right: Timeline and buttons */}
        <div className="flex flex-1 flex-col items-end gap-3">
          {/* Timeline dots */}
          <div className="scrollbar-hide flex items-center gap-1 overflow-x-auto">
            {Array.from({ length: total }).map((_, i) => {
              const isCompleted = i < completed
              const isNext = i === completed
              const itemNum = i + 1

              if (isCompleted) {
                return (
                  <div
                    key={i}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-xs font-bold text-white"
                  >
                    ✓
                  </div>
                )
              }

              if (isNext) {
                return (
                  <div
                    key={i}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white"
                  >
                    {itemNum}
                  </div>
                )
              }

              if (i < completed + 8) {
                return (
                  <div
                    key={i}
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center text-xs font-semibold ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {itemNum}
                  </div>
                )
              }

              if (i === completed + 8) {
                return (
                  <div
                    key={i}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center"
                  >
                    <Lock
                      size={14}
                      className={isDark ? 'text-slate-600' : 'text-slate-400'}
                    />
                  </div>
                )
              }

              return null
            })}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onRoadmapClick(roadmap.id)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition-all duration-200 hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/40"
            >
              <Play size={16} />
              Continue learning
            </button>
            <button
              onClick={() => onRoadmapClick(roadmap.id)}
              className={`text-sm font-medium transition-colors ${
                isDark
                  ? 'text-blue-400 hover:text-blue-300'
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              View roadmap →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface RoadmapCardProps2 {
  roadmap: Roadmap
  progress: ProgressStats | null
  isLocked: boolean
  onRoadmapClick: (roadmapId: string) => void
  roadmapDetail?: RoadmapDetail | null
}

const RoadmapCard: React.FC<RoadmapCardProps2> = ({
  roadmap,
  progress,
  isLocked,
  onRoadmapClick,
  roadmapDetail,
}) => {
  const percentage = progress?.percentage ?? 0
  const total = progress?.total ?? 0
  const completed = progress?.completed ?? 0

  // Calculate lesson and problem counts
  const lessonCount =
    roadmapDetail?.items?.filter(item => item.itemType === 'lesson').length ?? 0
  const problemCount =
    roadmapDetail?.items?.filter(item => item.itemType === 'problem').length ??
    0

  const getRoadmapIcon = (title: string): React.ReactNode => {
    if (title.toLowerCase().includes('c++')) {
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
          <Code2 className="text-blue-400" size={24} />
        </div>
      )
    }
    if (title.toLowerCase().includes('algorithm')) {
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
          <Hash className="text-purple-400" size={24} />
        </div>
      )
    }
    if (title.toLowerCase().includes('data')) {
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
          <BarChart3 className="text-blue-400" size={24} />
        </div>
      )
    }
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
        <Code2 className="text-green-400" size={24} />
      </div>
    )
  }

  return (
    <div
      className={`roadmap-card rounded-xl border transition-all duration-300 ${
        isLocked
          ? 'border-gray-800 bg-gray-900/50'
          : 'border-border bg-card hover:shadow-lg'
      } p-5`}
    >
      <div className="flex flex-col gap-4">
        {/* Header with icon and title */}
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            {getRoadmapIcon(roadmap.title)}
            {!isLocked && percentage > 0 && (
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-xs font-bold text-white">
                {percentage}%
              </div>
            )}
            {isLocked && (
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-700">
                <Lock size={12} className="text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-grow">
            <h3 className="mb-1 text-lg font-semibold text-foreground">
              {roadmap.title}
            </h3>
            <span className="inline-block rounded bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-300">
              Basic
            </span>
          </div>
        </div>

        {/* Description */}
        {roadmap.description && (
          <p className="text-sm text-muted-foreground">{roadmap.description}</p>
        )}

        {/* Progress info - shown only if not locked */}
        {!isLocked && total > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {completed}/{total} items
              </span>
              <span className="text-sm font-semibold text-green-500">
                {percentage}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-gray-700">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>~10 hours</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen size={12} />
                <span>{lessonCount} lessons</span>
              </div>
              <div className="flex items-center gap-1">
                <Terminal size={12} />
                <span>{problemCount} problems</span>
              </div>
            </div>
          </>
        )}

        {/* Locked state */}
        {isLocked && (
          <div className="flex items-center justify-center rounded-lg bg-gray-800/50 py-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Lock size={12} />
              <span>Complete the previous roadmap</span>
            </div>
          </div>
        )}

        {/* Action button */}
        <button
          onClick={() => onRoadmapClick(roadmap.id)}
          disabled={isLocked}
          className={`w-full rounded-lg px-4 py-2 font-medium transition-all duration-200 ${
            isLocked
              ? 'cursor-not-allowed bg-gray-700 text-gray-500'
              : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/25'
          }`}
        >
          {isLocked ? 'Locked' : percentage > 0 ? 'Continue' : 'Start'}
        </button>
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
  const [roadmapProgressMap, setRoadmapProgressMap] = useState<
    Record<string, ProgressStats | null>
  >({})
  const [roadmapDetailMap, setRoadmapDetailMap] = useState<
    Record<string, RoadmapDetail | null>
  >({})
  const [isLoadingRoadmaps, setIsLoadingRoadmaps] = useState<boolean>(false)
  const [availableRoadmaps, setAvailableRoadmaps] = useState<Roadmap[]>([])
  const [isLoadingAvailableRoadmaps, setIsLoadingAvailableRoadmaps] =
    useState<boolean>(false)
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.session.isAuthenticated
  )
  const userRoadmaps = useSelector(
    (state: RootState) => state.roadmap.userRoadmaps.items
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

  // Fetch available roadmaps from system
  useEffect(() => {
    let isMounted = true

    setIsLoadingAvailableRoadmaps(true)

    roadmapService
      .listRoadmaps(20, 0, 'public')
      .then(data => {
        if (!isMounted) return
        setAvailableRoadmaps(data.roadmaps || [])
      })
      .catch(() => {
        if (!isMounted) return
        setAvailableRoadmaps([])
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoadingAvailableRoadmaps(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Fetch user roadmaps when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    dispatch(asyncFetchUserRoadmaps({ limit: 20, offset: 0 }))
  }, [isAuthenticated, dispatch])

  // Fetch progress for each roadmap
  useEffect(() => {
    if (!isAuthenticated || userRoadmaps.length === 0) {
      setRoadmapProgressMap({})
      setRoadmapDetailMap({})
      setIsLoadingRoadmaps(false)
      return
    }

    let isMounted = true
    setIsLoadingRoadmaps(true)

    const fetchAllProgress = async () => {
      const progressMap: Record<string, ProgressStats | null> = {}
      const detailMap: Record<string, RoadmapDetail | null> = {}

      for (const roadmap of userRoadmaps) {
        try {
          const [progress, detail] = await Promise.all([
            roadmapService.getUserProgress(roadmap.id),
            roadmapService.getRoadmap(roadmap.id),
          ])
          if (isMounted) {
            progressMap[roadmap.id] = progress
            detailMap[roadmap.id] = detail
          }
        } catch {
          if (isMounted) {
            progressMap[roadmap.id] = null
            detailMap[roadmap.id] = null
          }
        }
      }

      if (isMounted) {
        setRoadmapProgressMap(progressMap)
        setRoadmapDetailMap(detailMap)
        setIsLoadingRoadmaps(false)
      }
    }

    fetchAllProgress()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated, userRoadmaps])

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

  const showRecentTopicProgress =
    hasRenderableTopicProgress(recentTopicProgress)
  const showRecentLessonProgress =
    hasRenderableLessonProgress(recentLessonProgress)

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
          (showRecentTopicProgress || showRecentLessonProgress) && (
            <div className="mb-12 mt-12">
              <h2 className="mb-6 text-2xl font-semibold text-foreground">
                Continue Practicing
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {showRecentTopicProgress && (
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

                {showRecentLessonProgress && (
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

        {/* Continue Roadmap Section - Show current/active roadmap */}
        {isAuthenticated &&
          !isLoadingRoadmaps &&
          userRoadmaps.length > 0 &&
          Object.values(roadmapProgressMap).some(
            p => p && p.percentage > 0
          ) && (
            <div className="mb-12 mt-12">
              <h2 className="mb-6 text-2xl font-semibold text-foreground">
                Continue Roadmap
              </h2>
              {(() => {
                // Get up to 4 roadmaps with some progress, or just the first ones if no progress
                const continueRoadmaps = userRoadmaps
                  .filter(
                    rm => roadmapProgressMap[rm.id]?.percentage !== undefined
                  )
                  .slice(0, 4)

                // If none found with progress, just show the first 4
                const displayRoadmaps =
                  continueRoadmaps.length > 0
                    ? continueRoadmaps
                    : userRoadmaps.slice(0, 4)

                if (displayRoadmaps.length > 0) {
                  return (
                    <div className="flex flex-col gap-6">
                      {displayRoadmaps.map(rm => (
                        <ContinueRoadmapCard
                          key={rm.id}
                          roadmap={rm}
                          progress={roadmapProgressMap[rm.id] || null}
                          isLocked={false}
                          onRoadmapClick={id => navigate(`/roadmaps/${id}`)}
                          roadmapDetail={roadmapDetailMap[rm.id] || null}
                        />
                      ))}
                    </div>
                  )
                }

                return null
              })()}
            </div>
          )}

        {/* Programming Roadmaps Section */}
        {isAuthenticated && (
          <div className="mb-12 mt-12">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-foreground">
                  Latest Roadmaps
                </h2>
                <span className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-3 py-1 text-xs font-medium text-white">
                  New
                </span>
              </div>
              <button
                onClick={() => navigate('/roadmaps')}
                className="flex items-center gap-1 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
              >
                Explore All Roadmaps
                <ChevronRight size={16} />
              </button>
            </div>

            {isLoadingAvailableRoadmaps ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
                  <p className="text-sm text-slate-500">Loading roadmaps...</p>
                </div>
              </div>
            ) : availableRoadmaps.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No roadmaps yet. Start your learning journey by exploring
                  available roadmaps.
                </p>
                <button
                  onClick={() => navigate('/roadmaps')}
                  className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Browse Roadmaps
                </button>
              </div>
            ) : (
              <>
                {(() => {
                  // Get 4 latest roadmaps
                  const latestRoadmaps = availableRoadmaps.slice(0, 4)

                  return (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      {latestRoadmaps.map(roadmap => (
                        <RoadmapCard
                          key={roadmap.id}
                          roadmap={roadmap}
                          progress={roadmapProgressMap[roadmap.id] || null}
                          isLocked={false}
                          onRoadmapClick={id => navigate(`/roadmaps/${id}`)}
                          roadmapDetail={roadmapDetailMap[roadmap.id] || null}
                        />
                      ))}
                    </div>
                  )
                })()}

                {/* Roadmap Progress Overview */}
                {userRoadmaps.length > 0 && (
                  <div className="mt-6 rounded-xl border border-border bg-card/50 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">
                        Roadmap Progress Overview
                      </h3>
                      <div className="text-sm text-gray-400">
                        {
                          Object.values(roadmapProgressMap).filter(
                            p => p && p.percentage > 0
                          ).length
                        }{' '}
                        / {userRoadmaps.length} roadmaps in progress
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                        style={{
                          width: `${
                            userRoadmaps.length > 0
                              ? Math.round(
                                  (Object.values(roadmapProgressMap).reduce(
                                    (acc, p) => acc + (p?.percentage || 0),
                                    0
                                  ) ?? 0) / userRoadmaps.length
                                )
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      Complete your roadmaps to master programming fundamentals
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

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
