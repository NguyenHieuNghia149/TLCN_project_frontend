import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit'
import {
  adminRoadmapAPI,
  type AdminRoadmapListParams,
  type AdminRoadmapRow,
} from '@/services/api/adminRoadmap.service'

type RejectValue = string

type AdminRoadmapState = {
  list: {
    items: AdminRoadmapRow[]
    total: number
    limit: number
    offset: number
    loading: boolean
    error: string | null
  }
  filters: AdminRoadmapListParams
  operation: {
    loading: boolean
    error: string | null
    success: boolean
  }
}

const initialState: AdminRoadmapState = {
  list: {
    items: [],
    total: 0,
    limit: 20,
    offset: 0,
    loading: false,
    error: null,
  },
  filters: {},
  operation: { loading: false, error: null, success: false },
}

type ErrorPayload = {
  response?: { data?: { error?: { message?: string } } }
}
const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as ErrorPayload)?.response?.data?.error?.message
  return typeof message === 'string' ? message : fallback
}

export const asyncFetchAdminRoadmaps = createAsyncThunk<
  {
    roadmaps: AdminRoadmapRow[]
    pagination: { limit: number; offset: number; total: number }
  },
  AdminRoadmapListParams,
  { rejectValue: RejectValue }
>('adminRoadmaps/fetchList', async (params, { rejectWithValue }) => {
  try {
    const response = await adminRoadmapAPI.listRoadmaps(params)
    return response.data
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Failed to fetch roadmaps'))
  }
})

export const asyncUpdateAdminRoadmapVisibility = createAsyncThunk<
  AdminRoadmapRow,
  { id: string; visibility: 'public' | 'private' },
  { rejectValue: RejectValue }
>(
  'adminRoadmaps/updateVisibility',
  async ({ id, visibility }, { rejectWithValue }) => {
    try {
      const response = await adminRoadmapAPI.updateVisibility(id, visibility)
      return response.data
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, 'Failed to update visibility')
      )
    }
  }
)

export const asyncDeleteAdminRoadmap = createAsyncThunk<
  { id: string },
  { id: string },
  { rejectValue: RejectValue }
>('adminRoadmaps/delete', async ({ id }, { rejectWithValue }) => {
  try {
    await adminRoadmapAPI.deleteRoadmap(id)
    return { id }
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Failed to delete roadmap'))
  }
})

export const asyncCreateAdminRoadmap = createAsyncThunk<
  AdminRoadmapRow,
  { title: string; description?: string; visibility?: 'public' | 'private' },
  { rejectValue: RejectValue }
>('adminRoadmaps/create', async (roadmapData, { rejectWithValue }) => {
  try {
    const response = await adminRoadmapAPI.createRoadmap(roadmapData)
    return response.data.roadmap as AdminRoadmapRow
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Failed to create roadmap'))
  }
})

const adminRoadmapSlice = createSlice({
  name: 'adminRoadmaps',
  initialState,
  reducers: {
    setAdminRoadmapFilters: (
      state,
      action: PayloadAction<AdminRoadmapListParams>
    ) => {
      state.filters = action.payload
    },
    clearAdminRoadmapOperationError: state => {
      state.operation.error = null
    },
    resetAdminRoadmapOperation: state => {
      state.operation.loading = false
      state.operation.error = null
      state.operation.success = false
    },
  },
  extraReducers: builder => {
    builder
      .addCase(asyncFetchAdminRoadmaps.pending, state => {
        state.list.loading = true
        state.list.error = null
      })
      .addCase(asyncFetchAdminRoadmaps.fulfilled, (state, action) => {
        state.list.loading = false
        state.list.items = action.payload.roadmaps
        state.list.total = action.payload.pagination.total
        state.list.limit = action.payload.pagination.limit
        state.list.offset = action.payload.pagination.offset
      })
      .addCase(asyncFetchAdminRoadmaps.rejected, (state, action) => {
        state.list.loading = false
        state.list.error = (action.payload as RejectValue) ?? null
      })

      .addCase(asyncUpdateAdminRoadmapVisibility.pending, state => {
        state.operation.loading = true
        state.operation.error = null
        state.operation.success = false
      })
      .addCase(asyncUpdateAdminRoadmapVisibility.fulfilled, (state, action) => {
        state.operation.loading = false
        state.operation.success = true
        state.list.items = state.list.items.map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r
        )
      })
      .addCase(asyncUpdateAdminRoadmapVisibility.rejected, (state, action) => {
        state.operation.loading = false
        state.operation.error = (action.payload as RejectValue) ?? null
        state.operation.success = false
      })

      .addCase(asyncDeleteAdminRoadmap.pending, state => {
        state.operation.loading = true
        state.operation.error = null
        state.operation.success = false
      })
      .addCase(asyncDeleteAdminRoadmap.fulfilled, (state, action) => {
        state.operation.loading = false
        state.operation.success = true
        state.list.items = state.list.items.filter(
          r => r.id !== action.payload.id
        )
      })
      .addCase(asyncDeleteAdminRoadmap.rejected, (state, action) => {
        state.operation.loading = false
        state.operation.error = (action.payload as RejectValue) ?? null
        state.operation.success = false
      })

      .addCase(asyncCreateAdminRoadmap.pending, state => {
        state.operation.loading = true
        state.operation.error = null
        state.operation.success = false
      })
      .addCase(asyncCreateAdminRoadmap.fulfilled, (state, action) => {
        state.operation.loading = false
        state.operation.success = true
        state.list.items = [action.payload, ...state.list.items]
        state.list.total += 1
      })
      .addCase(asyncCreateAdminRoadmap.rejected, (state, action) => {
        state.operation.loading = false
        state.operation.error = (action.payload as RejectValue) ?? null
        state.operation.success = false
      })
  },
})

export const {
  setAdminRoadmapFilters,
  clearAdminRoadmapOperationError,
  resetAdminRoadmapOperation,
} = adminRoadmapSlice.actions
export default adminRoadmapSlice.reducer
