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
import type {
  ProgressStats,
  RoadmapItemWithLockStatus,
} from '@/types/roadmap.types'

const RoadmapDetailPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const detail = useSelector((state: RootState) => state.roadmap.detail.current)
  const detailLoading = useSelector(
    (state: RootState) => state.roadmap.detail.loading
  )
  const operationError = useSelector(
    (state: RootState) => state.roadmap.operation.error
  )

  useEffect(() => {
    if (!id) return
    dispatch(asyncGetRoadmapDetailWithLocks(id))
    dispatch(asyncGetUserProgress(id))
  }, [dispatch, id])

  useEffect(() => {
    const handleRoadmapUpdate = () => {
      if (!id) return
      dispatch(asyncGetRoadmapDetailWithLocks(id))
      dispatch(asyncGetUserProgress(id))
    }
    window.addEventListener('roadmap-progress-updated', handleRoadmapUpdate)
    return () =>
      window.removeEventListener(
        'roadmap-progress-updated',
        handleRoadmapUpdate
      )
  }, [dispatch, id])

  useEffect(() => {
    if (operationError) {
      const errorMsg =
        operationError === 'PREREQUISITE_NOT_MET'
          ? '❌ Bạn cần hoàn thành bài trước đó trước'
          : `❌ ${operationError}`
      message.error(errorMsg)
    }
  }, [operationError])

  const effectiveProgress: ProgressStats = useMemo(() => {
    if (!detail)
      return { total: 0, completed: 0, percentage: 0, completedItems: [] }

    const completedItems = detail.items
      .filter(
        (item): item is RoadmapItemWithLockStatus =>
          'isCompleted' in item && item.isCompleted === true
      )
      .map(item => item.id)

    const total = detail.items.length
    const completed = completedItems.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, percentage, completedItems }
  }, [detail])

  if (!id) return <div className="p-4 text-slate-400">Roadmap not found.</div>

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Đang tải roadmap...</p>
        </div>
      </div>
    )
  }

  if (!detail)
    return <div className="p-4 text-slate-400">Roadmap not found.</div>

  const handleItemClick = (itemId: string) => {
    const item = detail.items.find(i => i.id === itemId)
    if (!item) return
    if ('isUnlocked' in item && !item.isUnlocked) return
    const roadmapParam = `?roadmapId=${id}`
    const linkTo =
      item.itemType === 'lesson'
        ? `/lessons/${item.itemId}${roadmapParam}`
        : `/problems/${item.itemId}${roadmapParam}`
    navigate(linkTo)
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(160deg,#020d18 0%,#060f1e 60%,#020d18 100%)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <RoadmapVisualTimeline
          roadmap={detail.roadmap}
          items={detail.items}
          progress={effectiveProgress}
          onItemClick={handleItemClick}
        />
      </div>
    </div>
  )
}

export default RoadmapDetailPage
