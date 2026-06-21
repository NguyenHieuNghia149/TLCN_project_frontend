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

const UserRoadmapsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const [showCreate, setShowCreate] = useState(false)
  const state = useSelector((root: RootState) => root.roadmap.userRoadmaps)

  useEffect(() => {
    dispatch(asyncFetchUserRoadmaps({ limit: 20, offset: 0 }))
  }, [dispatch])

  return (
    <div className="mx-auto max-w-5xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Roadmaps</h1>
        <button
          type="button"
          className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
          onClick={() => setShowCreate(true)}
        >
          Create New Roadmap
        </button>
      </div>

      {state.loading && <p>Loading...</p>}
      <div className="space-y-3">
        {state.items.map(roadmap => (
          <div
            key={roadmap.id}
            className="rounded-lg border border-slate-200 p-4"
          >
            <h3 className="text-lg font-semibold">{roadmap.title}</h3>
            <p className="text-sm text-slate-600">{roadmap.description}</p>
            <div className="mt-2 flex gap-3">
              <Link
                className="text-sm text-blue-600"
                to={`/roadmaps/${roadmap.id}`}
              >
                View
              </Link>
              <button
                type="button"
                className="text-sm text-red-600"
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
