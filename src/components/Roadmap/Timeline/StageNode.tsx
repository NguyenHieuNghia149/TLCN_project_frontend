import React from 'react'
import { getIconComponent } from '@/constants/roadmapStages'
import { FiCheck } from 'react-icons/fi'
import { useTheme } from '@/contexts/useTheme'

interface StageNodeProps {
  id: string
  label: string
  description: string
  icon?: string
  isCompleted: boolean
  isCurrent: boolean
  isActive: boolean
  colorClass?: string
  onClick?: () => void
  className?: string
  'data-testid'?: string
}

/**
 * StageNode Component - Circular timeline stage indicator
 *
 * States:
 *   - isCompleted: green background, checkmark badge
 *   - isCurrent: blue background, shadow highlight, underlined label
 *   - isActive: highlighted border
 *   - default: grey background
 *
 * Styling:
 *   - Size: w-20 h-20 (80x80px) for desktop
 *   - Radius: rounded-full (100%)
 *   - Icon: w-8 h-8 centered
 *   - Label: text-sm font-bold
 *   - Description: text-xs, fade animation on hover
 */
export const StageNode = React.memo<StageNodeProps>(
  ({
    label,
    description,
    icon,
    isCompleted,
    isCurrent,
    colorClass = 'bg-blue-400',
    onClick,
    className = '',
    'data-testid': testId,
  }) => {
    const { theme } = useTheme()
    const isDark = theme === 'dark'
    const IconComponent = icon ? getIconComponent(icon) : null

    // Determine styling based on state - prioritize completion state over color
    const getBackgroundClass = (): string => {
      if (isCompleted) {
        return 'bg-green-500'
      }
      if (isCurrent) {
        return 'bg-blue-500 ring-4 ring-blue-200 shadow-lg'
      }
      return colorClass // Use assigned color for normal state
    }

    return (
      <div
        className={`group relative flex flex-col items-center gap-3 ${className}`}
        role="img"
        aria-label={`${label} - ${
          isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'
        }`}
        aria-current={isCurrent ? 'step' : undefined}
        data-testid={testId}
      >
        {/* Stage node circle - colorful design matching the image */}
        <button
          onClick={onClick}
          className={`relative flex h-20 w-20 items-center justify-center rounded-full shadow-md transition-all duration-300 hover:scale-110 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${getBackgroundClass()} ${onClick ? 'cursor-pointer' : 'cursor-default'} `}
          type="button"
          aria-label={`${label}`}
        >
          {/* Icon - white color for contrast */}
          {IconComponent && (
            <IconComponent className="h-8 w-8 text-white" aria-hidden="true" />
          )}

          {/* Completion checkmark badge */}
          {isCompleted && (
            <div className="absolute bottom-1 right-1 rounded-full border-2 border-green-500 bg-white p-1">
              <FiCheck className="h-4 w-4 text-green-500" aria-hidden="true" />
            </div>
          )}
        </button>

        {/* Order/Label - number badge style */}
        <div className="flex flex-col items-center gap-1">
          <span
            className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
          >
            {label}
          </span>
        </div>

        {/* Description - shown on hover */}
        {description && (
          <div
            className={`pointer-events-none invisible absolute bottom-full z-10 mb-2 whitespace-nowrap rounded px-2 py-1 text-xs opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100 ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-700 text-white'}`}
          >
            {description}
          </div>
        )}
      </div>
    )
  }
)

StageNode.displayName = 'StageNode'
