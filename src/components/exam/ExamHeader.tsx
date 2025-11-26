import React from 'react'
import Button from '@/components/common/Button/Button'
import { Clock, BarChart3, List } from 'lucide-react'

interface ExamHeaderProps {
  examTitle: string
  totalChallenges: number
  currentChallenge: number
  timeRemaining: number // in seconds
  totalScore: number
  onShowChallengeList: () => void
}

const ExamHeader: React.FC<ExamHeaderProps> = ({
  examTitle,
  totalChallenges,
  currentChallenge,
  timeRemaining,
  totalScore,
  onShowChallengeList,
}) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const isTimeWarning = timeRemaining < 5 * 60

  return (
    <header
      className="sticky top-0 z-30 border-b shadow-sm"
      style={{
        backgroundColor: 'var(--exam-panel-bg)',
        borderColor: 'var(--surface-border)',
        transition: 'background-color 200ms ease, border-color 200ms ease',
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 md:px-6 md:py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--muted-text)' }}
          >
            Exam
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1
              className="text-xl font-semibold md:text-2xl"
              style={{ color: 'var(--text-color)' }}
            >
              {examTitle}
            </h1>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: 'var(--editor-bg)',
                color: 'var(--muted-text)',
                border: '1px solid var(--surface-border)',
              }}
            >
              Challenge {currentChallenge}/{totalChallenges}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex items-center gap-3 rounded-lg px-3 py-2"
            style={{
              backgroundColor: 'var(--exam-toolbar-bg)',
              border: '1px solid var(--surface-border)',
              transition:
                'background-color 200ms ease, border-color 200ms ease',
            }}
          >
            <Clock
              size={18}
              className={isTimeWarning ? 'animate-pulse' : ''}
              aria-hidden
              style={{ color: isTimeWarning ? '#f59e0b' : 'var(--accent)' }}
            />
            <div className="leading-tight">
              <p
                className="text-[11px] uppercase tracking-wider"
                style={{ color: 'var(--muted-text)' }}
              >
                Time left
              </p>
              <p
                className="text-base font-semibold md:text-lg"
                style={{
                  color: isTimeWarning ? '#f59e0b' : 'var(--text-color)',
                }}
              >
                {formatTime(timeRemaining)}
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-3 rounded-lg px-3 py-2"
            style={{
              backgroundColor: 'var(--exam-toolbar-bg)',
              border: '1px solid var(--surface-border)',
              transition:
                'background-color 200ms ease, border-color 200ms ease',
            }}
          >
            <BarChart3 size={18} style={{ color: 'var(--accent)' }} />
            <div className="leading-tight">
              <p
                className="text-[11px] uppercase tracking-wider"
                style={{ color: 'var(--muted-text)' }}
              >
                Total score
              </p>
              <p
                className="text-base font-semibold md:text-lg"
                style={{ color: 'var(--text-color)' }}
              >
                {totalScore}%
              </p>
            </div>
          </div>

          <Button
            onClick={onShowChallengeList}
            variant="primary"
            size="md"
            icon={<List size={16} />}
            aria-label="Show challenge list"
          >
            <span className="hidden sm:inline">Challenge list</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

export default ExamHeader
