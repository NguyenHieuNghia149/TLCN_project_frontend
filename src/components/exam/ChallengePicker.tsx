import React from 'react'
import { X, CheckCircle, Circle, Send } from 'lucide-react'
import { Challenge } from '@/types/challenge.types'

interface ChallengePickerProps {
  challenges: Challenge[]
  currentIndex: number
  onSelectChallenge: (index: number) => void
  onClose: () => void
  totalPoints?: number // Total points for the exam
  onSubmitExam?: () => void // Callback for submitting exam
}

const ChallengePicker: React.FC<ChallengePickerProps> = ({
  challenges,
  currentIndex,
  onSelectChallenge,
  onClose,
  totalPoints,
  onSubmitExam,
}) => {
  // Calculate total points from challenges if not provided
  const examTotalPoints =
    totalPoints ||
    challenges.reduce((sum, ch) => sum + (ch.totalPoints || 0), 0)
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'easy'
      case 'medium':
        return 'medium'
      case 'hard':
        return 'hard'
      default:
        return 'easy'
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl border-l shadow-lg"
        style={{
          backgroundColor: 'var(--exam-panel-bg)',
          borderColor: 'var(--surface-border)',
          transition: 'background-color 200ms ease, border-color 200ms ease',
        }}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-4 md:px-6 md:py-5"
          style={{ borderColor: 'var(--surface-border)' }}
        >
          <div>
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: 'var(--muted-text)' }}
            >
              Navigation
            </p>
            <h2
              className="mt-1 text-lg font-semibold md:text-xl"
              style={{ color: 'var(--text-color)' }}
            >
              All Challenges
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border p-2 transition-colors"
            style={{
              borderColor: 'var(--surface-border)',
              color: 'var(--muted-text)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--editor-bg)'
              e.currentTarget.style.color = 'var(--text-color)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--muted-text)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[calc(100%-72px)] flex-col">
          {/* Horizontal scrollable challenge list - each challenge as a row */}
          <div
            className="flex-1 overflow-x-auto overflow-y-hidden px-4 py-4"
            style={{ scrollbarWidth: 'thin' }}
          >
            <div className="flex flex-col gap-2" style={{ minWidth: '100%' }}>
              {challenges.map((challenge, index) => {
                const isActive = index === currentIndex
                const difficulty = getDifficultyColor(challenge.difficulty)

                return (
                  <button
                    key={challenge.id}
                    onClick={() => onSelectChallenge(index)}
                    className="flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left transition-colors"
                    style={{
                      borderColor: isActive
                        ? 'var(--accent)'
                        : 'var(--surface-border)',
                      backgroundColor: isActive
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'var(--editor-bg)',
                      transition:
                        'background-color 200ms ease, border-color 200ms ease',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = '#373741'
                        // e.currentTarget.style.borderColor = 'var(--accent)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor =
                          'var(--editor-bg)'
                        // e.currentTarget.style.borderColor = 'var(--surface-border)'
                      }
                    }}
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {index < currentIndex ? (
                        <CheckCircle
                          className="h-5 w-5"
                          style={{ color: '#10b981' }}
                        />
                      ) : (
                        <Circle
                          className="h-5 w-5"
                          style={{ color: 'var(--muted-text)' }}
                        />
                      )}
                    </div>

                    {/* Challenge Number */}
                    <div className="w-20 flex-shrink-0">
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--muted-text)' }}
                      >
                        #{index + 1}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="min-w-0 flex-1">
                      <h3
                        className="truncate text-base font-semibold"
                        style={{ color: 'var(--text-color)' }}
                      >
                        {challenge.title}
                      </h3>
                    </div>

                    {/* Difficulty Badge */}
                    <div className="flex-shrink-0">
                      <span
                        className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider"
                        style={{
                          borderColor:
                            difficulty === 'easy'
                              ? 'rgba(16, 185, 129, 0.3)'
                              : difficulty === 'medium'
                                ? 'rgba(251, 191, 36, 0.3)'
                                : 'rgba(239, 68, 68, 0.3)',
                          color:
                            difficulty === 'easy'
                              ? '#10b981'
                              : difficulty === 'medium'
                                ? '#f59e0b'
                                : '#ef4444',
                          backgroundColor:
                            difficulty === 'easy'
                              ? 'rgba(16, 185, 129, 0.1)'
                              : difficulty === 'medium'
                                ? 'rgba(251, 191, 36, 0.1)'
                                : 'rgba(239, 68, 68, 0.1)',
                        }}
                      >
                        {challenge.difficulty}
                      </span>
                    </div>

                    {/* Points */}
                    {challenge.totalPoints !== undefined && (
                      <div className="w-20 flex-shrink-0 text-right">
                        <span
                          className="text-sm font-semibold"
                          style={{ color: 'var(--accent)' }}
                        >
                          {challenge.totalPoints} pts
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div
            className="border-t px-4 py-4"
            style={{
              borderColor: 'var(--surface-border)',
              backgroundColor: 'var(--exam-toolbar-bg)',
            }}
          >
            <div className="mb-3 grid grid-cols-4 gap-4">
              <div className="text-center">
                <p
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--muted-text)' }}
                >
                  Total
                </p>
                <p
                  className="text-xl font-semibold md:text-2xl"
                  style={{ color: 'var(--text-color)' }}
                >
                  {challenges.length}
                </p>
              </div>
              <div className="text-center">
                <p
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--muted-text)' }}
                >
                  Current
                </p>
                <p
                  className="text-xl font-semibold md:text-2xl"
                  style={{ color: 'var(--text-color)' }}
                >
                  {currentIndex + 1}
                </p>
              </div>
              <div className="text-center">
                <p
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--muted-text)' }}
                >
                  Left
                </p>
                <p
                  className="text-xl font-semibold md:text-2xl"
                  style={{ color: 'var(--text-color)' }}
                >
                  {Math.max(challenges.length - currentIndex - 1, 0)}
                </p>
              </div>
              <div className="text-center">
                <p
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--muted-text)' }}
                >
                  Total Points
                </p>
                <p
                  className="text-xl font-semibold md:text-2xl"
                  style={{ color: 'var(--accent)' }}
                >
                  {examTotalPoints}
                </p>
              </div>
            </div>
            {onSubmitExam && (
              <div className="mb-4 mt-4 flex justify-center">
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        'Are you sure you want to submit the exam? This action cannot be undone.'
                      )
                    ) {
                      onSubmitExam()
                      onClose()
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg px-6 py-3 font-semibold transition-all"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(32, 215, 97, 0.3)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow =
                      '0 6px 16px rgba(32, 215, 97, 0.4)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow =
                      '0 4px 12px rgba(32, 215, 97, 0.3)'
                  }}
                >
                  <Send size={18} />
                  <span>Submit Exam</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default ChallengePicker
