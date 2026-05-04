import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import type { AppDispatch, RootState } from '@/store/stores'
import {
  asyncGetRoadmapDetail,
  asyncGetUserProgress,
} from '@/store/slices/roadmapSlice'
import { RoadmapProgressTracker } from '@/components/Roadmap/RoadmapProgressTracker'
import { Link } from 'react-router-dom'

const RoadmapDetailPage: React.FC = () => {
  const { id } = useParams()
  const dispatch = useDispatch<AppDispatch>()
  const detail = useSelector((state: RootState) => state.roadmap.detail.current)
  const progress = useSelector((state: RootState) =>
    id ? state.roadmap.progress[id] : undefined
  )

  useEffect(() => {
    if (!id) return
    dispatch(asyncGetRoadmapDetail(id))
    dispatch(asyncGetUserProgress(id))
  }, [dispatch, id])

  if (!id || !detail) return <div className="p-4">Roadmap not found.</div>

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="text-2xl font-bold">{detail.roadmap.title}</h1>
      <p className="mt-1 text-slate-600">{detail.roadmap.description}</p>

      {progress && (
        <div className="mt-4">
          <RoadmapProgressTracker stats={progress} />
        </div>
      )}

      <div className="mt-4 space-y-2">
        {detail.items
          .slice()
          .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
          .map(item => {
            const isCompleted = Boolean(
              progress?.completedItems.includes(item.id)
            )
            const linkTo =
              item.itemType === 'lesson'
                ? `/lessons/${item.itemId}`
                : `/problems/${item.itemId}`

            return (
              <Link
                key={item.id}
                to={linkTo}
                className={`flex items-center justify-between rounded border p-3 transition-colors hover:bg-slate-50 ${isCompleted ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}
              >
                <div>
                  <p className="font-medium text-slate-900">
                    <span className="mr-2 text-slate-500">#{item.order}</span>
                    {item.itemTitle || item.itemId}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
                    {item.itemType}
                  </p>
                </div>
                <div className="flex items-center">
                  {isCompleted ? (
                    <span className="flex items-center text-sm font-medium text-green-600">
                      <svg
                        className="mr-1 h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Completed
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-blue-600">
                      Start
                      <svg
                        className="ml-1 inline-block h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
      </div>
    </div>
  )
}

export default RoadmapDetailPage
