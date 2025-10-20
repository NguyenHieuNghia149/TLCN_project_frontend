import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Star } from 'lucide-react'
import { Challenge } from '@/types/challenge.types'

interface Props {
  challenge: Challenge
}

const difficultyColor: Record<Challenge['difficulty'], string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-red-400',
}

const ChallengeCard: React.FC<Props> = ({ challenge }) => {
  const navigate = useNavigate()
  const goToDetail = () => navigate(`/problems/${challenge.id}`)

  return (
    <div className="rounded-xl border border-gray-800 bg-[#1f202a] p-5 transition-colors hover:border-gray-700">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="mb-1 text-lg font-semibold">{challenge.title}</h3>
          <div className="mb-3 flex items-center gap-3 text-[12px]">
            <span className={difficultyColor[challenge.difficulty]}>
              {challenge.difficulty}
            </span>
            {typeof challenge.totalPoints === 'number' && (
              <span className="text-gray-400">
                Max Score: {challenge.totalPoints}
              </span>
            )}
            <span className="text-gray-500">{challenge.topic}</span>
          </div>
          <p className="line-clamp-2 text-sm text-gray-400">
            {/* {challenge.description} */}
            This is a description of the challenge
          </p>
        </div>

        <div className="ml-2 flex items-center gap-3">
          <button
            aria-label={challenge.isFavorite ? 'Unfavorite' : 'Favorite'}
            title={challenge.isFavorite ? 'Favorite' : 'Add to Favorite'}
            className="rounded p-1.5 transition-colors hover:bg-gray-800"
          >
            <span
              className={
                challenge.isFavorite ? 'text-yellow-400' : 'text-gray-500'
              }
            >
              <Star className="h-4 w-4" />
            </span>
          </button>

          <button
            onClick={goToDetail}
            className="inline-flex h-[36px] w-[150px] items-center justify-center rounded border border-gray-700 bg-green-500 text-[14px] font-medium text-black transition-colors hover:border-transparent hover:bg-green-300 disabled:cursor-default disabled:opacity-90"
          >
            {challenge.isSolve ? (
              <>
                Solved
                <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>Solve Challenge</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChallengeCard
