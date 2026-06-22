import React, { useState } from 'react'
import type { CreateRoadmapDto } from '@/types/roadmap.types'
import { useTheme } from '@/contexts/useTheme'

interface RoadmapCreateModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateRoadmapDto) => Promise<void>
}

export const RoadmapCreateModal: React.FC<RoadmapCreateModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await onSubmit({ title, description, visibility })
      setTitle('')
      setDescription('')
      setVisibility('public')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create roadmap')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        className={`w-full max-w-lg rounded-lg p-4 transition-colors ${isDark ? 'bg-slate-800' : 'bg-white'}`}
      >
        <h3
          className={`mb-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}
        >
          Create roadmap
        </h3>
        {error && (
          <div
            className={`mb-3 rounded border px-3 py-2 text-sm ${isDark ? 'border-red-800 bg-red-900/30 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}
          >
            {error}
          </div>
        )}
        <input
          className={`mb-3 w-full rounded border px-3 py-2 transition-colors ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400' : 'border-slate-300 bg-white text-slate-900'}`}
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className={`mb-3 w-full rounded border px-3 py-2 transition-colors ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-400' : 'border-slate-300 bg-white text-slate-900'}`}
          placeholder="Description"
          rows={4}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <select
          className={`mb-4 w-full rounded border px-3 py-2 transition-colors ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
          value={visibility}
          onChange={e => setVisibility(e.target.value as 'public' | 'private')}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className={`rounded border px-3 py-2 transition-colors ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            disabled={loading || title.trim().length < 3}
            onClick={handleSubmit}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
