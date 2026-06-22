import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/store/stores'
import { Link } from 'react-router-dom'
import {
  asyncCreateRoadmap,
  asyncDeleteRoadmap,
  asyncFetchUserRoadmaps,
} from '@/store/slices/roadmapSlice'
import { RoadmapCreateModal } from '@/components/Roadmap/RoadmapCreateModal'
import { useTheme } from '@/contexts/useTheme'

const UserRoadmapsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [showCreate, setShowCreate] = useState(false)
  const state = useSelector((root: RootState) => root.roadmap.userRoadmaps)

  useEffect(() => {
    dispatch(asyncFetchUserRoadmaps({ limit: 20, offset: 0 }))
  }, [dispatch])

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1
          className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}
        >
          My Roadmaps
        </h1>
        <button
          type="button"
          className="rounded bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
          onClick={() => setShowCreate(true)}
        >
          Create New Roadmap
        </button>
      </div>

      {state.loading && (
        <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
          Loading...
        </p>
      )}
      <div className="space-y-3">
        {state.items.map(roadmap => (
          <div
            key={roadmap.id}
            className={`rounded-lg border p-4 transition-colors ${
              isDark
                ? 'border-slate-700 bg-slate-900/50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <h3
              className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              {roadmap.title}
            </h3>
            <p
              className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
            >
              {roadmap.description}
            </p>
            <div className="mt-2 flex gap-3">
              <Link
                className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                to={`/roadmaps/${roadmap.id}`}
              >
                View
              </Link>
              <button
                type="button"
                className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'} hover:underline`}
                onClick={() => dispatch(asyncDeleteRoadmap(roadmap.id))}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <RoadmapCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={async payload => {
          await dispatch(asyncCreateRoadmap(payload)).unwrap()
          await dispatch(asyncFetchUserRoadmaps({ limit: 20, offset: 0 }))
        }}
      />
    </div>
  )
}

export default UserRoadmapsPage
