import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/store/stores'
import { Link } from 'react-router-dom'
import { asyncFetchRoadmaps } from '@/store/slices/roadmapSlice'

const RoadmapListPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { items, loading } = useSelector(
    (state: RootState) => state.roadmap.list
  )

  useEffect(() => {
    dispatch(asyncFetchRoadmaps({ limit: 20, offset: 0 }))
  }, [dispatch])

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Learning roadmaps</h1>
      {loading && <p>Loading...</p>}
      <div className="space-y-3">
        {items.map(roadmap => (
          <div
            key={roadmap.id}
            className="rounded-lg border border-slate-200 p-4"
          >
            <h3 className="text-lg font-semibold">{roadmap.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{roadmap.description}</p>
            <Link
              className="mt-2 inline-block text-sm text-blue-600"
              to={`/roadmaps/${roadmap.id}`}
            >
              Start Learning
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RoadmapListPage
