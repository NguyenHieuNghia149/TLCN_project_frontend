import React from 'react'
import { useTheme } from '@/contexts/useTheme'

interface RoadmapItemCompletionButtonProps {
  roadmapId: string
  itemId: string
  completed: boolean
  disabled?: boolean
  onToggle: (roadmapId: string, itemId: string, completed: boolean) => void
}

export const RoadmapItemCompletionButton: React.FC<
  RoadmapItemCompletionButtonProps
> = ({ roadmapId, itemId, completed, disabled, onToggle }) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(roadmapId, itemId, completed)}
      className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
        completed
          ? isDark
            ? 'bg-green-900/40 text-green-300'
            : 'bg-green-100 text-green-700'
          : isDark
            ? 'bg-slate-700 text-slate-300'
            : 'bg-slate-100 text-slate-700'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      {completed ? 'Completed' : 'Mark done'}
    </button>
  )
}
