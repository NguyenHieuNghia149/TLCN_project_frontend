import React, { useState } from 'react'
import type { CreateRoadmapDto } from '@/types/roadmap.types'

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
      <div className="w-full max-w-lg rounded-lg bg-white p-4">
        <h3 className="mb-4 text-lg font-semibold">Create roadmap</h3>
        {error && (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <input
          className="mb-3 w-full rounded border border-slate-300 px-3 py-2"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          className="mb-3 w-full rounded border border-slate-300 px-3 py-2"
          placeholder="Description"
          rows={4}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <select
          className="mb-4 w-full rounded border border-slate-300 px-3 py-2"
          value={visibility}
          onChange={e => setVisibility(e.target.value as 'public' | 'private')}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded border px-3 py-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-60"
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
