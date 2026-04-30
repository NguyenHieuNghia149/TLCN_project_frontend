import { describe, expect, it } from 'vitest'

import reducer, {
  asyncFetchAdminRoadmaps,
} from '@/store/slices/adminRoadmapSlice'

describe('adminRoadmapSlice', () => {
  it('handles fetch fulfilled', () => {
    const state = reducer(undefined, {
      type: asyncFetchAdminRoadmaps.fulfilled.type,
      payload: {
        roadmaps: [
          {
            id: 'r1',
            title: 'Roadmap 1',
            description: null,
            createdBy: 'u1',
            visibility: 'public',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            creatorEmail: null,
            creatorFirstName: null,
            creatorLastName: null,
            itemCount: 0,
          },
        ],
        pagination: { limit: 20, offset: 0, total: 1 },
      },
    })

    expect(state.list.items).toHaveLength(1)
    expect(state.list.total).toBe(1)
    expect(state.list.loading).toBe(false)
  })
})
