import React, { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { message } from 'antd'
import type { AppDispatch, RootState } from '@/store/stores'
import {
  asyncGetRoadmapDetailWithLocks,
  asyncGetUserProgress,
} from '@/store/slices/roadmapSlice'
import { RoadmapVisualTimeline } from '@/components/Roadmap/Timeline/RoadmapVisualTimeline'
import type { ProgressStats } from '@/types/roadmap.types'

const RoadmapDetailPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const detail = useSelector((state: RootState) => state.roadmap.detail.current)
  const detailLoading = useSelector((state: RootState) => state.roadmap.detail.loading)
  const operationError = useSelector((state: RootState) => state.roadmap.operation.error)
  const progress = useSelector((state: RootState) =>
    id ? state.roadmap.progress[id] : undefined
  )
  const currentUser = useSelector((state: RootState) => state.auth.session.user)

  useEffect(() => {
    if (!id) return
    // R14.8: Use getRoadmapDetailWithLocks to get sequential unlock info
    dispatch(asyncGetRoadmapDetailWithLocks(id))
    dispatch(asyncGetUserProgress(id))
  }, [dispatch, id])

  // Show error messages
  useEffect(() => {
    if (operationError) {
      const errorMsg =
        operationError === 'PREREQUISITE_NOT_MET'
          ? '❌ You must complete the previous item first'
          : `❌ ${operationError}`
      message.error(errorMsg)
    }
  }, [operationError])

  // Default progress when not yet loaded
  const effectiveProgress: ProgressStats = useMemo(() => {
    if (progress) return progress
    return {
      total: detail?.items.length ?? 0,
      completed: 0,
      percentage: 0,
      completedItems: [],
    }
  }, [progress, detail])

  if (!id) return <div className="p-4">Roadmap not found.</div>

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading roadmap...</p>
        </div>
      </div>
    )
  }

  if (!detail) return <div className="p-4">Roadmap not found.</div>

  // Check ownership to set isEditable flag
  const isOwner = currentUser?.id === detail.roadmap.createdBy

  const handleItemClick = (itemId: string) => {
    // Navigate to lesson/problem detail page
    const item = detail.items.find(i => i.id === itemId)
    if (item) {
      const linkTo = item.itemType === 'lesson' ? `/lessons/${item.itemId}` : `/problems/${item.itemId}`
      navigate(linkTo)
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      {/* Timeline Visualization */}
      <div className="mt-4">
        <RoadmapVisualTimeline
          roadmap={detail.roadmap}
          items={detail.items}
          progress={effectiveProgress}
          onItemClick={handleItemClick}
        />
      </div>

      {/* R14.10: Completion Progress Indicator */}
      {effectiveProgress.completed > 0 && (
        <div className="mt-8 text-center">
          <div className="inline-block rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              🎯 Progress: <span className="text-green-600">{effectiveProgress.completed}</span>
              /{effectiveProgress.total} items completed
              {effectiveProgress.percentage > 0 && (
                <span className="ml-2 text-green-600">
                  ({effectiveProgress.percentage}%)
                </span>
              )}
            </p>
          </div>
        </div>
      )}



      {/* R14.10: Accessibility & Visual Feedback */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }

        /* Success toast animations */
        .ant-message {
          animation: message-slide-up 0.3s cubic-bezier(0.23, 1, 0.32, 1) !important;
        }

        @keyframes message-slide-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default RoadmapDetailPage
