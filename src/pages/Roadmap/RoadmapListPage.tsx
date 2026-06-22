import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import type { AppDispatch, RootState } from '@/store/stores'
import { asyncFetchRoadmaps } from '@/store/slices/roadmapSlice'
import { roadmapService } from '@/services/api/roadmap.service'
import type { RoadmapDetail, ProgressStats } from '@/types/roadmap.types'
import { Code2, Hash, BarChart3, ChevronRight } from 'lucide-react'
import { useTheme } from '@/contexts/useTheme'

const RoadmapListPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { items, total, loading } = useSelector(
    (state: RootState) => state.roadmap.list
  )
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.session.isAuthenticated
  )
  const userRoadmaps = useSelector(
    (state: RootState) => state.roadmap.userRoadmaps.items
  )

  const [roadmapDetailsMap, setRoadmapDetailsMap] = useState<
    Record<string, RoadmapDetail | null>
  >({})
  const [roadmapProgressMap, setRoadmapProgressMap] = useState<
    Record<string, ProgressStats | null>
  >({})
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    dispatch(
      asyncFetchRoadmaps({
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        visibility: 'public',
      })
    )
  }, [dispatch, currentPage])

  // Fetch details and progress for all roadmaps
  useEffect(() => {
    if (items.length === 0) {
      return
    }

    let isMounted = true
    setIsLoadingDetails(true)

    const fetchAllDetails = async () => {
      const detailsMap: Record<string, RoadmapDetail | null> = {}
      const progressMap: Record<string, ProgressStats | null> = {}

      for (const roadmap of items) {
        try {
          const [detail, progress] = await Promise.all([
            roadmapService.getRoadmap(roadmap.id),
            isAuthenticated
              ? roadmapService.getUserProgress(roadmap.id)
              : Promise.resolve(null),
          ])

          if (isMounted) {
            detailsMap[roadmap.id] = detail
            progressMap[roadmap.id] = progress
          }
        } catch {
          if (isMounted) {
            detailsMap[roadmap.id] = null
            progressMap[roadmap.id] = null
          }
        }
      }

      if (isMounted) {
        setRoadmapDetailsMap(detailsMap)
        setRoadmapProgressMap(progressMap)
        setIsLoadingDetails(false)
      }
    }

    fetchAllDetails()

    return () => {
      isMounted = false
    }
  }, [items, isAuthenticated])

  const isRoadmapInUserList = (roadmapId: string) => {
    return userRoadmaps.some(rm => rm.id === roadmapId)
  }

  const RoadmapCard: React.FC<{
    roadmapId: string
    title: string
    description: string | null
    isInUserList: boolean
  }> = ({ roadmapId, title, description, isInUserList }) => {
    const detail = roadmapDetailsMap[roadmapId]
    const progress = roadmapProgressMap[roadmapId]

    const percentage = progress?.percentage ?? 0
    const total = progress?.total ?? 0
    const completed = progress?.completed ?? 0

    const lessonCount =
      detail?.items?.filter(item => item.itemType === 'lesson').length ?? 0
    const problemCount =
      detail?.items?.filter(item => item.itemType === 'problem').length ?? 0

    const getRoadmapIcon = (title: string) => {
      if (title.toLowerCase().includes('c++')) {
        return (
          <svg
            className="h-20 w-20"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
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
        className={`roadmap-list-card rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${
          isDark
            ? 'border-slate-700/50 bg-slate-900/80'
            : 'border-slate-200/50 bg-white/80'
        }`}
      >
        <div className="flex items-center gap-6">
          {/* Left side: Icon with progress circle */}
          <div className="relative flex flex-shrink-0 flex-col items-center">
            {getRoadmapIcon(title)}
            {/* Progress circle */}
            {isInUserList && (
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
            )}
          </div>

          {/* Left-middle: Title and info */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h3
                className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}
              >
                {title}
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
            {isInUserList && (
              <div
                className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
              >
                <span className="font-semibold text-green-400">
                  {completed}/{total}
                </span>
                <span
                  className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  {' '}
                  items completed
                </span>
              </div>
            )}

            {/* Description */}
            {description && (
              <p
                className={`line-clamp-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
              >
                {description}
              </p>
            )}

            {/* Details */}
            <div
              className={`flex items-center gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
            >
              <span>{lessonCount} lessons</span>
              <span>•</span>
              <span>{problemCount} problems</span>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="ml-auto flex flex-col gap-1">
            <button
              onClick={() => navigate(`/roadmaps/${roadmapId}`)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition-all duration-200 hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/40"
            >
              <ChevronRight size={16} />
              {isInUserList
                ? percentage > 0
                  ? 'Continue'
                  : 'Start'
                : 'View details'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Learning Roadmaps
          </h1>
          <p className="mt-2 text-muted-foreground">
            Choose a roadmap and start your learning journey
          </p>
        </div>

        {loading || isLoadingDetails ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Loading roadmaps...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(roadmap => (
              <RoadmapCard
                key={roadmap.id}
                roadmapId={roadmap.id}
                title={roadmap.title}
                description={roadmap.description}
                isInUserList={isRoadmapInUserList(roadmap.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !isLoadingDetails && total > itemsPerPage && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                isDark
                  ? 'border-slate-700 hover:bg-slate-800'
                  : 'border-slate-300 hover:bg-slate-100'
              }`}
            >
              Previous
            </button>
            <div
              className={`flex items-center px-4 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
            >
              Page {currentPage} of {Math.ceil(total / itemsPerPage)}
            </div>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= Math.ceil(total / itemsPerPage)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                isDark
                  ? 'border-slate-700 hover:bg-slate-800'
                  : 'border-slate-300 hover:bg-slate-100'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default RoadmapListPage
