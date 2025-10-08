// src/features/challenges/components/ChallengeSearch.tsx
import React from 'react'

interface Props {
  query: string
  onChange: (value: string) => void
}

const ChallengeSearch: React.FC<Props> = ({ query, onChange }) => {
  return (
    <input
      type="text"
      placeholder="Search challenges..."
      value={query}
      onChange={e => onChange(e.target.value)}
      className="mb-6 w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  )
}

export default ChallengeSearch
