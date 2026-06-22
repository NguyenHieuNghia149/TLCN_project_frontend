import React from 'react'
import type { ProgressStats } from '@/types/roadmap.types'
import { useTheme } from '@/contexts/useTheme'

interface RoadmapProgressTrackerProps {
  stats: ProgressStats
  compact?: boolean
}

export const RoadmapProgressTracker: React.FC<RoadmapProgressTrackerProps> = ({
  stats,
  compact,
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-white'}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
        >
          Progress
        </span>
        <span
          className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
        >
          {stats.percentage}%
        </span>
      </div>
      <div
        className={`h-2 w-full overflow-hidden rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
      >
        <div
          className={`h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`}
          style={{ width: `${stats.percentage}%` }}
        />
      </div>
      {!compact && (
        <p
          className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
        >
          {stats.completed}/{stats.total} items completed
        </p>
      )}
    </div>
  )
}
