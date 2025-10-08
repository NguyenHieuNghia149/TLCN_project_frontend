// src/components/challenge/ChallengeFilter.tsx
import { useState, useEffect } from 'react'

interface ChallengeFilterProps {
  topic?: string
  onFilterChange: (filters: { difficulty?: string }) => void
}

/**
 * Bộ lọc challenge (có thể tách riêng theo topic nếu muốn mở rộng)
 */
export const ChallengeFilter = ({
  topic,
  onFilterChange,
}: ChallengeFilterProps) => {
  const [difficulty, setDifficulty] = useState<string>('')

  useEffect(() => {
    onFilterChange({ difficulty })
  }, [difficulty, onFilterChange])

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <h2 className="text-xl font-bold">{topic ?? 'Tất cả chủ đề'}</h2>

      <select
        value={difficulty}
        onChange={e => setDifficulty(e.target.value)}
        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tất cả độ khó</option>
        <option value="easy">Dễ</option>
        <option value="medium">Trung bình</option>
        <option value="hard">Khó</option>
      </select>
    </div>
  )
}
