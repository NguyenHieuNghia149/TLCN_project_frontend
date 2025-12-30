import React from 'react'
import { Search } from 'lucide-react'

interface Props {
  query: string
  onChange: (query: string) => void
}

const LessonSearch: React.FC<Props> = ({ query, onChange }) => {
  return (
    <div className="rounded-lg bg-transparent p-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search lessons..."
          value={query}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-lg border border-input bg-input py-2 pl-10 pr-3 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>
    </div>
  )
}

export default LessonSearch
