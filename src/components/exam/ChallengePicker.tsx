import React from 'react'
import { X, CheckCircle, Circle } from 'lucide-react'
import { Challenge } from '@/types/challenge.types'

interface ChallengePickerProps {
  challenges: Challenge[]
  currentIndex: number
  onSelectChallenge: (index: number) => void
  onClose: () => void
}

const ChallengePicker: React.FC<ChallengePickerProps> = ({
  challenges,
  currentIndex,
  onSelectChallenge,
  onClose,
}) => {
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
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-white/5 bg-[#05060c] shadow-[0_20px_70px_rgba(3,6,15,0.85)]">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-gray-500">
              Navigation
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Challenges
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-gray-400 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex h-[calc(100%-72px)] flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-3">
              {challenges.map((challenge, index) => {
                const isActive = index === currentIndex
                const difficulty = getDifficultyColor(challenge.difficulty)

                return (
                  <button
                    key={challenge.id}
                    onClick={() => onSelectChallenge(index)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      isActive
                        ? 'border-primary-400/60 bg-primary-500/10 shadow-[0_15px_35px_rgba(59,130,246,0.35)]'
                        : 'border-white/5 bg-white/5 hover:border-primary-400/40 hover:bg-primary-500/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {index < currentIndex ? (
                          <CheckCircle className="h-5 w-5 text-emerald-300" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm uppercase tracking-wider text-gray-400">
                            Challenge {index + 1}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${
                              difficulty === 'easy'
                                ? 'border-emerald-400/30 text-emerald-200'
                                : difficulty === 'medium'
                                  ? 'border-amber-400/30 text-amber-200'
                                  : 'border-rose-400/30 text-rose-200'
                            }`}
                          >
                            {challenge.difficulty}
                          </span>
                        </div>
                        <h3 className="mt-1 text-base font-semibold text-white">
                          {challenge.title}
                        </h3>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 border-t border-white/5 bg-white/5 px-4 py-4 text-center text-white">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500">
                Total
              </p>
              <p className="text-2xl font-semibold">{challenges.length}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500">
                Current
              </p>
              <p className="text-2xl font-semibold">{currentIndex + 1}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500">
                Left
              </p>
              <p className="text-2xl font-semibold">
                {Math.max(challenges.length - currentIndex - 1, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ChallengePicker
