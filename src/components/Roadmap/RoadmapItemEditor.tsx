import React, { useMemo, useState } from 'react'
import type { AddItemDto, RoadmapItem } from '@/types/roadmap.types'

interface RoadmapItemEditorProps {
  roadmapId: string
  items: RoadmapItem[]
  readonly?: boolean
  onAddItem: (input: AddItemDto) => Promise<void>
  onRemoveItem: (itemId: string) => Promise<void>
  onReorder: (itemIds: string[]) => Promise<void>
}

export const RoadmapItemEditor: React.FC<RoadmapItemEditorProps> = ({
  items,
  readonly,
  onAddItem,
  onRemoveItem,
  onReorder,
}) => {
  const [itemType, setItemType] = useState<'lesson' | 'problem'>('lesson')
  const [itemId, setItemId] = useState('')

  const orderedItems = useMemo(
    () =>
      [...items].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)),
    [items]
  )

  const move = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= orderedItems.length) return
    const next = [...orderedItems]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    await onReorder(next.map(item => item.id))
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h4 className="mb-3 text-sm font-semibold">Roadmap items</h4>
      {!readonly && (
        <div className="mb-4 flex gap-2">
          <select
            className="rounded border border-slate-300 px-2 py-1"
            value={itemType}
            onChange={e => setItemType(e.target.value as 'lesson' | 'problem')}
          >
            <option value="lesson">Lesson</option>
            <option value="problem">Problem</option>
          </select>
          <input
            className="flex-1 rounded border border-slate-300 px-2 py-1"
            value={itemId}
            onChange={e => setItemId(e.target.value)}
            placeholder="Item ID"
          />
          <button
            type="button"
            className="rounded bg-blue-600 px-3 py-1 text-white"
            onClick={() => {
              if (!itemId.trim()) return
              onAddItem({ itemType, itemId: itemId.trim() }).then(() =>
                setItemId('')
              )
            }}
          >
            Add
          </button>
        </div>
      )}

      <div className="space-y-2">
        {orderedItems.map((item, idx) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded border px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium">
                #{item.order} {item.itemType.toUpperCase()}
              </p>
              <p className="text-xs text-slate-500">{item.itemId}</p>
            </div>
            {!readonly && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border px-2"
                  onClick={() => move(idx, idx - 1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="rounded border px-2"
                  onClick={() => move(idx, idx + 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="rounded border border-red-300 px-2 text-red-600"
                  onClick={() => onRemoveItem(item.id)}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
