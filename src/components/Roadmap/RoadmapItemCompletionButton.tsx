import React from 'react'

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
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(roadmapId, itemId, completed)}
      className={`rounded px-3 py-1 text-xs font-medium ${
        completed
          ? 'bg-green-100 text-green-700'
          : 'bg-slate-100 text-slate-700'
      }`}
    >
      {completed ? 'Completed' : 'Mark done'}
    </button>
  )
}
