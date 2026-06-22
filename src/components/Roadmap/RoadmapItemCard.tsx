import React, { useState } from 'react'
import { FiCheckCircle, FiLock } from 'react-icons/fi'
import type { RoadmapItemWithLockStatus } from '@/types/roadmap.types'
import { useTheme } from '@/contexts/useTheme'

interface RoadmapItemCardProps {
  item: RoadmapItemWithLockStatus
  onComplete?: (itemId: string) => Promise<void>
  loading?: boolean
}

/**
 * R14.6: RoadmapItemCard with Sequential Unlock Status
 * R14.10: Added visual feedback & animations
 *
 * Displays roadmap item with lock status indicator:
 * - UNLOCKED: Bright border, clickable, normal text + complete button
 * - LOCKED: Faded background, grey border, disabled, lock icon + prerequisite message
 * - COMPLETED: Green tint, checkmark icon, button disabled but shown
 */
export const RoadmapItemCard: React.FC<RoadmapItemCardProps> = ({
  item,
  onComplete,
  loading = false,
}) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const isInteractive = item.isUnlocked && !item.isCompleted

  const handleComplete = async () => {
    if (isInteractive && onComplete && !loading) {
      setIsAnimating(true)
      try {
        await onComplete(item.id)
        // Show success animation
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      } catch (err) {
        console.error('Failed to complete item:', err)
      } finally {
        setIsAnimating(false)
      }
    }
  }

  return (
    <>
      {/* Success Confetti/Animation Overlay */}
      {showSuccess && (
        <div className="pointer-events-none">
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="animate-bounce">
              <div className="text-6xl">✨</div>
            </div>
          </div>
          {/* Confetti particles */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`confetti-${i}`}
              className="pointer-events-none fixed z-50"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10px`,
                animation: `fall ${2}s linear forwards`,
                animationDelay: `${Math.random() * 0.3}s`,
              }}
            >
              {['🎉', '🎊', '✨', '🏆'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
      )}

      <div
        className={`rounded-lg border-2 p-4 transition-all duration-300 ${
          item.isCompleted
            ? isDark
              ? 'border-green-700 bg-green-900/30'
              : 'border-green-300 bg-green-50'
            : item.isUnlocked
              ? isAnimating
                ? isDark
                  ? 'scale-105 border-blue-500 bg-blue-900/40 shadow-lg'
                  : 'scale-105 border-blue-400 bg-blue-50 shadow-lg'
                : isDark
                  ? 'hover:scale-102 cursor-pointer border-blue-700/50 bg-slate-800 hover:border-blue-500 hover:shadow-md'
                  : 'hover:scale-102 cursor-pointer border-blue-300 bg-white hover:border-blue-400 hover:shadow-md'
              : isDark
                ? 'scale-100 border-slate-700 bg-slate-800/50 opacity-60'
                : 'scale-100 border-slate-200 bg-slate-50 opacity-60'
        } hover:transition-transform ${!item.isUnlocked && !item.isCompleted && 'cursor-not-allowed'} `}
        data-testid={`roadmap-item-${item.id}`}
        role="region"
        aria-label={`${item.itemTitle || `Item ${item.order}`} - ${
          item.isCompleted
            ? 'Completed'
            : item.isUnlocked
              ? 'Available to start'
              : 'Locked'
        }`}
      >
        {/* Header: Title + Status Icons */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3
            className={`flex-1 text-sm font-bold leading-tight transition-colors duration-200 ${
              item.isCompleted
                ? isDark
                  ? 'text-green-400'
                  : 'text-green-700'
                : item.isUnlocked
                  ? isDark
                    ? 'text-white'
                    : 'text-slate-900'
                  : isDark
                    ? 'text-slate-500'
                    : 'text-slate-500'
            } `}
          >
            {item.itemTitle || `Item ${item.order}`}
          </h3>

          {/* Status Icons with Animation */}
          <div className="flex flex-shrink-0 gap-2">
            {item.isCompleted && (
              <FiCheckCircle
                className="h-5 w-5 flex-shrink-0 animate-pulse text-green-500"
                aria-label="Completed"
                data-testid={`icon-completed-${item.id}`}
              />
            )}
            {!item.isUnlocked && (
              <FiLock
                className="h-5 w-5 flex-shrink-0 text-slate-400"
                aria-label="Locked"
                data-testid={`icon-locked-${item.id}`}
              />
            )}
          </div>
        </div>

        {/* Item Type Badge */}
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              item.itemType === 'lesson'
                ? isDark
                  ? 'bg-blue-900/40 text-blue-300'
                  : 'bg-blue-100 text-blue-700'
                : isDark
                  ? 'bg-purple-900/40 text-purple-300'
                  : 'bg-purple-100 text-purple-700'
            } `}
          >
            {item.itemType === 'lesson' ? '📚 Lesson' : '🔧 Problem'}
          </span>
          <span className="text-xs text-slate-500">#{item.order}</span>
        </div>

        {/* Lock Reason / Info Message with Animation */}
        {item.lockReason && (
          <div
            className={`animate-slide-in mb-4 rounded border-l-4 p-3 ${isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-slate-100'}`}
          >
            <p
              className={`flex items-center gap-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
            >
              <FiLock className="h-4 w-4 flex-shrink-0" />
              {item.lockReason}
            </p>
          </div>
        )}

        {!item.isUnlocked && !item.lockReason && (
          <div
            className={`animate-slide-in mb-4 rounded border-l-4 p-3 ${isDark ? 'border-blue-700 bg-blue-900/30' : 'border-blue-300 bg-blue-50'}`}
          >
            <p
              className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}
            >
              ℹ️ Complete the previous item to unlock this one.
            </p>
          </div>
        )}

        {/* Action Buttons with Hover Effects */}
        <div className="flex gap-2">
          {isInteractive ? (
            <button
              onClick={handleComplete}
              disabled={loading}
              className={`flex-1 transform rounded px-3 py-2 text-sm font-medium transition-all duration-200 ${
                loading
                  ? 'scale-95 cursor-not-allowed bg-blue-300 text-white opacity-75'
                  : 'cursor-pointer bg-blue-500 text-white hover:scale-105 hover:bg-blue-600 active:scale-95'
              } `}
              data-testid={`btn-complete-${item.id}`}
              aria-label={`Mark ${item.itemTitle} as complete`}
              aria-busy={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Completing...
                </span>
              ) : (
                '✓ Mark Complete'
              )}
            </button>
          ) : item.isCompleted ? (
            <button
              disabled
              className="flex-1 cursor-default rounded bg-green-500 px-3 py-2 text-sm font-medium text-white opacity-70 transition-opacity"
              data-testid={`btn-completed-${item.id}`}
              aria-disabled="true"
            >
              ✓ Completed
            </button>
          ) : (
            <button
              disabled
              className={`flex-1 cursor-not-allowed rounded px-3 py-2 text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-slate-700 text-slate-400'
                  : 'bg-slate-300 text-slate-600'
              }`}
              data-testid={`btn-locked-${item.id}`}
              aria-disabled="true"
              title={item.lockReason || 'Item is locked'}
            >
              🔒 Locked
            </button>
          )}
        </div>

        {/* Accessibility: aria-live region for screen readers */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {item.itemTitle || `Item ${item.order}`} status:{' '}
          {item.isCompleted
            ? 'completed'
            : item.isUnlocked
              ? 'available'
              : 'locked'}
          {item.lockReason && `. ${item.lockReason}`}
          {loading && '. Currently completing this item'}
        </div>
      </div>

      {/* CSS for confetti and animations */}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes slide-in {
          from {
            transform: translateX(-8px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .scale-102 {
          transform: scale(1.02);
        }
      `}</style>
    </>
  )
}

export default RoadmapItemCard
