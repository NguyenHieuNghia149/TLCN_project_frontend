import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { roadmapService } from '@/services/api/roadmap.service'
import type {
  AddItemDto,
  CreateRoadmapDto,
  ProgressStats,
  Roadmap,
  RoadmapDetail,
  RoadmapItem,
  RoadmapItemWithLockStatus,
} from '@/types/roadmap.types'

type RoadmapState = {
  list: {
    items: Roadmap[]
    total: number
    limit: number
    offset: number
    loading: boolean
    error: string | null
  }
  userRoadmaps: {
    items: Roadmap[]
    total: number
    limit: number
    offset: number
    loading: boolean
    error: string | null
  }
  detail: {
    current: RoadmapDetail | null
    loading: boolean
    error: string | null
  }
  progress: Record<string, ProgressStats>
  operation: {
    loading: boolean
    success: boolean
    error: string | null
  }
}

const initialState: RoadmapState = {
  list: {
    items: [],
    total: 0,
    limit: 20,
    offset: 0,
    loading: false,
    error: null,
  },
  userRoadmaps: {
    items: [],
    total: 0,
    limit: 20,
    offset: 0,
    loading: false,
    error: null,
  },
  detail: { current: null, loading: false, error: null },
  progress: {},
  operation: { loading: false, success: false, error: null },
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Request failed'

export const asyncCreateRoadmap = createAsyncThunk(
  'roadmap/create',
  async (payload: CreateRoadmapDto, { rejectWithValue }) => {
    try {
      return await roadmapService.createRoadmap(payload)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const asyncFetchRoadmaps = createAsyncThunk(
  'roadmap/fetchList',
  async (params: { limit: number; offset: number }, { rejectWithValue }) => {
    try {
      return await roadmapService.listRoadmaps(params.limit, params.offset)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const asyncFetchUserRoadmaps = createAsyncThunk(
  'roadmap/fetchUserRoadmaps',
  async (params: { limit: number; offset: number }, { rejectWithValue }) => {
    try {
      return await roadmapService.listUserRoadmaps(params.limit, params.offset)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const asyncGetRoadmapDetail = createAsyncThunk(
  'roadmap/getDetail',
  async (roadmapId: string, { rejectWithValue }) => {
    try {
      return await roadmapService.getRoadmap(roadmapId)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const asyncUpdateRoadmap = createAsyncThunk(
  'roadmap/update',
  async (
    { id, data }: { id: string; data: Partial<CreateRoadmapDto> },
    { rejectWithValue }
  ) => {
    try {
      return await roadmapService.updateRoadmap(id, data)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const asyncDeleteRoadmap = createAsyncThunk(
  'roadmap/delete',
  async (roadmapId: string, { rejectWithValue }) => {
    try {
      await roadmapService.deleteRoadmap(roadmapId)
      return roadmapId
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const asyncAddItem = createAsyncThunk(
  'roadmap/addItem',
  async (
    { roadmapId, itemData }: { roadmapId: string; itemData: AddItemDto },
    { rejectWithValue }
  ) => {
    try {
      return await roadmapService.addItem(roadmapId, itemData)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const asyncRemoveItem = createAsyncThunk(
  'roadmap/removeItem',
  async (
    { roadmapId, itemId }: { roadmapId: string; itemId: string },
    { rejectWithValue }
  ) => {
    try {
      await roadmapService.removeItem(roadmapId, itemId)
      return itemId
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const asyncReorderItems = createAsyncThunk(
  'roadmap/reorderItems',
  async (
    { roadmapId, itemIds }: { roadmapId: string; itemIds: string[] },
    { rejectWithValue }
  ) => {
    try {
      await roadmapService.reorderItems(roadmapId, itemIds)
      return { roadmapId, itemIds }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const asyncGetUserProgress = createAsyncThunk(
  'roadmap/getProgress',
  async (roadmapId: string, { rejectWithValue }) => {
    try {
      const stats = await roadmapService.getUserProgress(roadmapId)
      return { roadmapId, stats }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const asyncMarkItemCompleted = createAsyncThunk(
  'roadmap/markComplete',
  async (
    { roadmapId, itemId }: { roadmapId: string; itemId: string },
    { rejectWithValue }
  ) => {
    try {
      await roadmapService.markItemCompleted(roadmapId, itemId)
      return { roadmapId, itemId }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

export const asyncMarkItemIncomplete = createAsyncThunk(
  'roadmap/markIncomplete',
  async (
    { roadmapId, itemId }: { roadmapId: string; itemId: string },
    { rejectWithValue }
  ) => {
    try {
      await roadmapService.markItemIncomplete(roadmapId, itemId)
      return { roadmapId, itemId }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

/**
 * R14.7: Get roadmap detail with sequential unlock status
 * Frontend calls this instead of getRoadmap when user needs lock status
 */
export const asyncGetRoadmapDetailWithLocks = createAsyncThunk(
  'roadmap/getDetailWithLocks',
  async (roadmapId: string, { rejectWithValue }) => {
    try {
      return await roadmapService.getRoadmapDetailWithLockStatus(roadmapId)
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

/**
 * R14.7: Complete roadmap item with prerequisite validation
 * Backend validates that previous item is completed
 * Returns unlocked next item if available
 */
export const asyncCompleteRoadmapItem = createAsyncThunk(
  'roadmap/completeItem',
  async (
    { roadmapId, itemId }: { roadmapId: string; itemId: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await roadmapService.completeRoadmapItem(roadmapId, itemId)
      return { roadmapId, ...result }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  }
)

const roadmapSlice = createSlice({
  name: 'roadmap',
  initialState,
  reducers: {
    clearRoadmapError: state => {
      state.operation.error = null
      state.detail.error = null
      state.list.error = null
      state.userRoadmaps.error = null
    },
    resetOperationState: state => {
      state.operation.loading = false
      state.operation.success = false
      state.operation.error = null
    },
    invalidateRoadmapDetail: state => {
      state.detail.current = null
    },
  },
  extraReducers: builder => {
    builder
      .addCase(asyncCreateRoadmap.pending, state => {
        state.operation.loading = true
        state.operation.error = null
        state.operation.success = false
      })
      .addCase(asyncCreateRoadmap.fulfilled, (state, action) => {
        state.operation.loading = false
        state.operation.success = true
        state.list.items.unshift(action.payload)
        state.userRoadmaps.items.unshift(action.payload)
      })
      .addCase(asyncCreateRoadmap.rejected, (state, action) => {
        state.operation.loading = false
        state.operation.error =
          (action.payload as string) || 'Failed to create roadmap'
      })
      .addCase(asyncFetchRoadmaps.pending, state => {
        state.list.loading = true
      })
      .addCase(asyncFetchRoadmaps.fulfilled, (state, action) => {
        state.list.loading = false
        state.list.items = action.payload.roadmaps
        state.list.total = action.payload.total
      })
      .addCase(asyncFetchRoadmaps.rejected, (state, action) => {
        state.list.loading = false
        state.list.error =
          (action.payload as string) || 'Failed to fetch roadmaps'
      })
      .addCase(asyncFetchUserRoadmaps.pending, state => {
        state.userRoadmaps.loading = true
      })
      .addCase(asyncFetchUserRoadmaps.fulfilled, (state, action) => {
        state.userRoadmaps.loading = false
        state.userRoadmaps.items = action.payload.roadmaps
        state.userRoadmaps.total = action.payload.total
      })
      .addCase(asyncFetchUserRoadmaps.rejected, (state, action) => {
        state.userRoadmaps.loading = false
        state.userRoadmaps.error =
          (action.payload as string) || 'Failed to fetch user roadmaps'
      })
      .addCase(asyncGetRoadmapDetail.pending, state => {
        state.detail.loading = true
      })
      .addCase(asyncGetRoadmapDetail.fulfilled, (state, action) => {
        state.detail.loading = false
        state.detail.current = action.payload
      })
      .addCase(asyncGetRoadmapDetail.rejected, (state, action) => {
        state.detail.loading = false
        state.detail.error =
          (action.payload as string) || 'Failed to load roadmap'
      })
      .addCase(asyncUpdateRoadmap.fulfilled, (state, action) => {
        state.operation.success = true
        if (state.detail.current?.roadmap.id === action.payload.id) {
          state.detail.current.roadmap = action.payload
        }
        state.list.items = state.list.items.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
        state.userRoadmaps.items = state.userRoadmaps.items.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      })
      .addCase(asyncDeleteRoadmap.fulfilled, (state, action) => {
        state.operation.success = true
        state.list.items = state.list.items.filter(
          item => item.id !== action.payload
        )
        state.userRoadmaps.items = state.userRoadmaps.items.filter(
          item => item.id !== action.payload
        )
        if (state.detail.current?.roadmap.id === action.payload)
          state.detail.current = null
      })
      .addCase(asyncAddItem.fulfilled, (state, action) => {
        state.operation.success = true
        if (state.detail.current) {
          const payloadWithLocks: RoadmapItemWithLockStatus = {
            ...(action.payload as RoadmapItem),
            isCompleted: false,
            isUnlocked: false,
          }
          state.detail.current.items.push(
            payloadWithLocks as RoadmapItemWithLockStatus
          )
        }
      })
      .addCase(asyncRemoveItem.fulfilled, (state, action) => {
        state.operation.success = true
        if (state.detail.current) {
          state.detail.current.items = state.detail.current.items.filter(
            item => item.id !== action.payload
          )
        }
      })
      .addCase(asyncReorderItems.fulfilled, (state, action) => {
        const { itemIds } = action.payload
        if (state.detail.current?.items) {
          const itemMap = new Map(
            state.detail.current.items.map(i => [i.id, i])
          )
          const newItems: RoadmapItemWithLockStatus[] = []
          itemIds.forEach((id, idx) => {
            const item = itemMap.get(id)
            if (item) {
              ;(item as RoadmapItemWithLockStatus).order = idx + 1
              newItems.push(item as RoadmapItemWithLockStatus)
            }
          })

          state.detail.current.items = newItems
        }
      })
      .addCase(asyncGetUserProgress.fulfilled, (state, action) => {
        state.progress[action.payload.roadmapId] = action.payload.stats
      })
      .addCase(asyncMarkItemCompleted.fulfilled, (state, action) => {
        const progress = state.progress[action.payload.roadmapId]
        if (!progress) return
        if (!progress.completedItems.includes(action.payload.itemId)) {
          progress.completedItems.push(action.payload.itemId)
          progress.completed += 1
          progress.percentage =
            progress.total > 0
              ? Math.round((progress.completed / progress.total) * 100)
              : 0
        }
      })
      .addCase(asyncMarkItemIncomplete.fulfilled, (state, action) => {
        const progress = state.progress[action.payload.roadmapId]
        if (!progress) return
        if (progress.completedItems.includes(action.payload.itemId)) {
          progress.completedItems = progress.completedItems.filter(
            id => id !== action.payload.itemId
          )
          progress.completed = Math.max(0, progress.completed - 1)
          progress.percentage =
            progress.total > 0
              ? Math.round((progress.completed / progress.total) * 100)
              : 0
        }
      })
      /**
       * R14.7: Handle asyncGetRoadmapDetailWithLocks
       * Similar to asyncGetRoadmapDetail but for lock status display
       */
      .addCase(asyncGetRoadmapDetailWithLocks.pending, state => {
        state.detail.loading = true
      })
      .addCase(asyncGetRoadmapDetailWithLocks.fulfilled, (state, action) => {
        state.detail.loading = false
        state.detail.current = action.payload
      })
      .addCase(asyncGetRoadmapDetailWithLocks.rejected, (state, action) => {
        state.detail.loading = false
        state.detail.error =
          (action.payload as string) || 'Failed to load roadmap'
      })
      /**
       * R14.7: Handle asyncCompleteRoadmapItem
       * Mark item complete and update progress
       */
      .addCase(asyncCompleteRoadmapItem.pending, state => {
        state.operation.loading = true
        state.operation.error = null
        state.operation.success = false
      })
      .addCase(asyncCompleteRoadmapItem.fulfilled, (state, action) => {
        state.operation.loading = false
        state.operation.success = true

        if (state.detail.current?.roadmap.id === action.payload.roadmapId) {
          const items = state.detail.current.items
          if (items) {
            for (let i = 0; i < items.length; i++) {
              const it = items[i] as RoadmapItemWithLockStatus
              if (it.id === action.payload.item.id) {
                it.isCompleted = true
                it.isUnlocked = true
                it.lockReason = null
              }
              if (
                action.payload.unlockedNextItem &&
                it.id === action.payload.unlockedNextItem.id
              ) {
                it.isUnlocked = true
                it.lockReason = null
                if (action.payload.unlockedNextItem.isCompleted) {
                  it.isCompleted = true
                }
              }
            }
          }
        }

        const progress = state.progress[action.payload.roadmapId]
        if (
          progress &&
          !progress.completedItems.includes(action.payload.item.id)
        ) {
          progress.completedItems.push(action.payload.item.id)
          progress.completed += 1
          progress.percentage =
            progress.total > 0
              ? Math.round((progress.completed / progress.total) * 100)
              : 0
        }
      })
      .addCase(asyncCompleteRoadmapItem.rejected, (state, action) => {
        state.operation.loading = false
        state.operation.error =
          (action.payload as string) || 'Failed to complete item'
      })
  },
})

export const { clearRoadmapError, resetOperationState } = roadmapSlice.actions
export default roadmapSlice.reducer
