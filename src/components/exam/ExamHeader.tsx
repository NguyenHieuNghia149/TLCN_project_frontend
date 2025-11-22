import React from 'react'
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
    <header className="sticky top-0 z-30 border-b border-white/5 bg-[#05060c]/95 shadow-[0_25px_60px_rgba(2,3,8,0.85)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
            Exam
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-white lg:text-3xl">
              {examTitle}
            </h1>
            <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300">
              Challenge {currentChallenge}/{totalChallenges}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#0c0f1c] px-4 py-3 shadow-[0_15px_35px_rgba(6,8,20,0.45)]">
            <Clock
              size={22}
              className={`${
                isTimeWarning
                  ? 'animate-pulse text-amber-300'
                  : 'text-emerald-300'
              }`}
            />
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-[0.4em] text-gray-500">
                Time left
              </p>
              <p
                className={`text-lg font-semibold ${
                  isTimeWarning ? 'text-amber-200' : 'text-white'
                }`}
              >
                {formatTime(timeRemaining)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#0c0f1c] px-4 py-3 shadow-[0_15px_35px_rgba(6,8,20,0.45)]">
            <BarChart3 size={22} className="text-sky-300" />
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-[0.4em] text-gray-500">
                Total score
              </p>
              <p className="text-lg font-semibold text-white">{totalScore}%</p>
            </div>
          </div>

          <button
            onClick={onShowChallengeList}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-primary-500/80 to-sky-400/80 px-4 py-3 text-sm font-semibold text-black shadow-[0_15px_40px_rgba(37,99,235,0.45)] transition hover:from-primary-400 hover:to-sky-300"
          >
            <List size={18} />
            <span className="hidden sm:inline">Challenge list</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default ExamHeader
