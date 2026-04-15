import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { adminService } from '@/services/api/adminUser.service'
import type { BannedUser } from '@/services/api/adminUser.service'

type RejectValue = string

interface ErrorPayload {
  response?: {
    data?: {
      error?: {
        message?: string
      }
    }
  }
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as ErrorPayload)?.response?.data?.error?.message
  return typeof message === 'string' ? message : fallback
}

interface AdminState {
  bannedUsers: {
    list: BannedUser[]
    total: number
    limit: number
    offset: number
    loading: boolean
    error: string | null
  }
  banOperation: {
    loading: boolean
    error: string | null
    success: boolean
  }
}

const initialState: AdminState = {
  bannedUsers: {
    list: [],
    total: 0,
    limit: 20,
    offset: 0,
    loading: false,
    error: null,
  },
  banOperation: {
    loading: false,
    error: null,
    success: false,
  },
}

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
      return rejectWithValue(getErrorMessage(error, 'Failed to ban user'))
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
      return rejectWithValue(getErrorMessage(error, 'Failed to unban user'))
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
      return rejectWithValue(
        getErrorMessage(error, 'Failed to fetch banned users')
      )
    }
  }
)

// Slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
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
        state.banOperation.error = (action.payload as RejectValue) ?? null
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
        state.banOperation.error = (action.payload as RejectValue) ?? null
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
        state.bannedUsers.error = (action.payload as RejectValue) ?? null
      })
  },
})

export const { clearBanError, setPaginationParams } = adminSlice.actions
export default adminSlice.reducer
