// src/features/challenges/components/ChallengeList.tsx
import React from 'react'
import ChallengeCard from './ChallengeCard'
import { Challenge } from '@/types/challenge.types'

interface Props {
  loaderRef: React.RefObject<HTMLDivElement | null>
  loading: boolean
  challenges: Challenge[]
}

const ChallengeList: React.FC<Props> = ({ challenges, loaderRef, loading }) => {
  return (
    <div className="flex flex-col gap-4">
      {challenges.map(c => (
        <ChallengeCard key={c.id} challenge={c} />
      ))}

      {loading && (
        <p className="py-4 text-center text-gray-500">Loading more...</p>
      )}

      {/* Điểm quan sát (lazy load trigger) */}
      <div ref={loaderRef} className="h-10" />
    </div>
  )
}

export default ChallengeList
