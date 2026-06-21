import React from 'react'
import type { ProgressStats } from '@/types/roadmap.types'

interface RoadmapProgressTrackerProps {
  stats: ProgressStats
  compact?: boolean
}

export const RoadmapProgressTracker: React.FC<RoadmapProgressTrackerProps> = ({
  stats,
  compact,
}) => {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">Progress</span>
        <span className="text-sm text-slate-600">{stats.percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-blue-500"
          style={{ width: `${stats.percentage}%` }}
        />
      </div>
      {!compact && (
        <p className="mt-2 text-sm text-slate-600">
          {stats.completed}/{stats.total} items completed
        </p>
      )}
    </div>
  )
}
