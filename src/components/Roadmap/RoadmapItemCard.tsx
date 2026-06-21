import React, { useState } from 'react'
import { FiCheckCircle, FiLock } from 'react-icons/fi'
import type { RoadmapItemWithLockStatus } from '@/types/roadmap.types'

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
              className="fixed z-50 pointer-events-none"
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
        className={`
          transition-all duration-300 rounded-lg border-2 p-4
          ${item.isCompleted
            ? 'bg-green-50 border-green-300 shadow-md scale-100'
            : item.isUnlocked
              ? isAnimating
                ? 'bg-blue-50 border-blue-400 shadow-lg scale-105'
                : 'bg-white border-blue-300 hover:shadow-md hover:scale-102 hover:border-blue-400 cursor-pointer'
              : 'bg-slate-50 border-slate-200 opacity-60 scale-100'
          }
          hover:transition-transform
          ${!item.isUnlocked && 'cursor-not-allowed'}
        `}
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
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3
            className={`
              font-bold text-sm flex-1 leading-tight
              transition-colors duration-200
              ${item.isCompleted
                ? 'text-green-700'
                : item.isUnlocked
                  ? 'text-slate-900'
                  : 'text-slate-500'
              }
            `}
          >
            {item.itemTitle || `Item ${item.order}`}
          </h3>

          {/* Status Icons with Animation */}
          <div className="flex gap-2 flex-shrink-0">
            {item.isCompleted && (
              <FiCheckCircle
                className="w-5 h-5 text-green-500 flex-shrink-0 animate-pulse"
                aria-label="Completed"
                data-testid={`icon-completed-${item.id}`}
              />
            )}
            {!item.isUnlocked && (
              <FiLock
                className="w-5 h-5 text-slate-400 flex-shrink-0"
                aria-label="Locked"
                data-testid={`icon-locked-${item.id}`}
              />
            )}
          </div>
        </div>

        {/* Item Type Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`
              text-xs font-medium px-2 py-1 rounded transition-colors
              ${item.itemType === 'lesson'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-purple-100 text-purple-700'
              }
            `}
          >
            {item.itemType === 'lesson' ? '📚 Lesson' : '🔧 Problem'}
          </span>
          <span className="text-xs text-slate-500">
            #{item.order}
          </span>
        </div>

        {/* Lock Reason / Info Message with Animation */}
        {item.lockReason && (
          <div className="mb-4 rounded bg-slate-100 border-l-4 border-slate-300 p-3 animate-slide-in">
            <p className="text-xs text-slate-700 flex items-center gap-2">
              <FiLock className="w-4 h-4 flex-shrink-0" />
              {item.lockReason}
            </p>
          </div>
        )}

        {!item.isUnlocked && !item.lockReason && (
          <div className="mb-4 rounded bg-blue-50 border-l-4 border-blue-300 p-3 animate-slide-in">
            <p className="text-xs text-blue-700">
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
              className={`
                flex-1 py-2 px-3 rounded font-medium text-sm
                transition-all duration-200 transform
                ${loading
                  ? 'bg-blue-300 text-white cursor-not-allowed scale-95 opacity-75'
                  : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer hover:scale-105 active:scale-95'
                }
              `}
              data-testid={`btn-complete-${item.id}`}
              aria-label={`Mark ${item.itemTitle} as complete`}
              aria-busy={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Completing...
                </span>
              ) : (
                '✓ Mark Complete'
              )}
            </button>
          ) : item.isCompleted ? (
            <button
              disabled
              className="flex-1 py-2 px-3 rounded font-medium text-sm bg-green-500 text-white opacity-70 cursor-default transition-opacity"
              data-testid={`btn-completed-${item.id}`}
              aria-disabled="true"
            >
              ✓ Completed
            </button>
          ) : (
            <button
              disabled
              className="flex-1 py-2 px-3 rounded font-medium text-sm bg-slate-300 text-slate-600 cursor-not-allowed transition-colors"
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

