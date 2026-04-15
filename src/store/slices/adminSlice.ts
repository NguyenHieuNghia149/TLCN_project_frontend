import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { adminService } from '@/services/api/adminUser.service'

// Async Thunks
export const asyncBanUser = createAsyncThunk(
  'admin/banUser',
  async (
    { userId, reason }: { userId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await adminService.banUser(userId, reason)
      return response.data
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } }
      }
      return rejectWithValue(
        err.response?.data?.error?.message || 'Failed to ban user'
      )
    }
  }
)

export const asyncUnbanUser = createAsyncThunk(
  'admin/unbanUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await adminService.unbanUser(userId)
      return response.data
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } }
      }
      return rejectWithValue(
        err.response?.data?.error?.message || 'Failed to unban user'
      )
    }
  }
)

export const asyncFetchBannedUsers = createAsyncThunk(
  'admin/fetchBannedUsers',
  async (
    { limit, offset }: { limit: number; offset: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await adminService.listBannedUsers(limit, offset)
      return response.data
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } }
      }
      return rejectWithValue(
        err.response?.data?.error?.message || 'Failed to fetch banned users'
      )
    }
  }
)

// Slice
const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    bannedUsers: {
      list: [] as Record<string, unknown>[],
      total: 0,
      limit: 20,
      offset: 0,
      loading: false,
      error: null as string | null,
    },
    banOperation: {
      loading: false,
      error: null as string | null,
      success: false,
    },
  },
  reducers: {
    clearBanError: state => {
      state.banOperation.error = null
    },
    setPaginationParams: (state, action) => {
      state.bannedUsers.limit = action.payload.limit
      state.bannedUsers.offset = action.payload.offset
    },
  },
  extraReducers: builder => {
    // Ban user
    builder
      .addCase(asyncBanUser.pending, state => {
        state.banOperation.loading = true
        state.banOperation.error = null
        state.banOperation.success = false
      })
      .addCase(asyncBanUser.fulfilled, state => {
        state.banOperation.loading = false
        state.banOperation.success = true
      })
      .addCase(asyncBanUser.rejected, (state, action) => {
        state.banOperation.loading = false
        state.banOperation.error = action.payload
        state.banOperation.success = false
      })

    // Unban user
    builder
      .addCase(asyncUnbanUser.pending, state => {
        state.banOperation.loading = true
        state.banOperation.error = null
        state.banOperation.success = false
      })
      .addCase(asyncUnbanUser.fulfilled, state => {
        state.banOperation.loading = false
        state.banOperation.success = true
      })
      .addCase(asyncUnbanUser.rejected, (state, action) => {
        state.banOperation.loading = false
        state.banOperation.error = action.payload
        state.banOperation.success = false
      })

    // Fetch banned users
    builder
      .addCase(asyncFetchBannedUsers.pending, state => {
        state.bannedUsers.loading = true
        state.bannedUsers.error = null
      })
      .addCase(asyncFetchBannedUsers.fulfilled, (state, action) => {
        state.bannedUsers.loading = false
        state.bannedUsers.list = action.payload.users
        state.bannedUsers.total = action.payload.pagination.total
      })
      .addCase(asyncFetchBannedUsers.rejected, (state, action) => {
        state.bannedUsers.loading = false
        state.bannedUsers.error = action.payload
      })
  },
})

export const { clearBanError, setPaginationParams } = adminSlice.actions
export default adminSlice.reducer
