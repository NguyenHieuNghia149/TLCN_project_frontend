import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { commentApi, CommentLikeStatus } from '@/services/api/comment.service'

/**
 * Redux Slice for Comment Features (Pin and Like)
 * Manages:
 * - Comment pin/unpin operations
 * - Comment like/unlike operations
 * - Like count and status caching
 */

export interface CommentState {
  byId: Record<
    string,
    {
      isPinned?: boolean
      likeCount?: number
      userHasLiked?: boolean
      pinLoading?: boolean
      pinError?: string | null
      likeLoading?: boolean
      likeError?: string | null
    }
  >
  loading: boolean
  error: string | null
}

const initialState: CommentState = {
  byId: {},
  loading: false,
  error: null,
}

/**
 * Async Thunks
 */

// Pin Comment
export const asyncPinComment = createAsyncThunk(
  'comments/pin',
  async (commentId: string, { rejectWithValue }) => {
    try {
      const response = await commentApi.pinComment(commentId)
      return {
        commentId,
        isPinned: response.data.isPinned,
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } }
      }
      return rejectWithValue(
        err.response?.data?.error?.message || 'Failed to pin comment'
      )
    }
  }
)

// Unpin Comment
export const asyncUnpinComment = createAsyncThunk(
  'comments/unpin',
  async (commentId: string, { rejectWithValue }) => {
    try {
      const response = await commentApi.unpinComment(commentId)
      return {
        commentId,
        isPinned: response.data.isPinned,
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } }
      }
      return rejectWithValue(
        err.response?.data?.error?.message || 'Failed to unpin comment'
      )
    }
  }
)

// Toggle Like Comment
export const asyncToggleLikeComment = createAsyncThunk(
  'comments/toggleLike',
  async (commentId: string, { rejectWithValue }) => {
    try {
      const response = await commentApi.toggleLikeComment(commentId)
      return {
        commentId,
        liked: response.data.liked,
        totalLikes: response.data.totalLikes,
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } }
      }
      return rejectWithValue(
        err.response?.data?.error?.message || 'Failed to toggle like'
      )
    }
  }
)

// Get Comment Like Status
export const asyncGetCommentLikeStatus = createAsyncThunk(
  'comments/getLikeStatus',
  async (commentId: string, { rejectWithValue }) => {
    try {
      const response = await commentApi.getCommentLikeStatus(commentId)
      return {
        commentId,
        totalLikes: response.data.totalLikes,
        userHasLiked: response.data.userHasLiked,
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } }
      }
      return rejectWithValue(
        err.response?.data?.error?.message || 'Failed to get like status'
      )
    }
  }
)

// Get Batch Like Status
export const asyncGetBatchLikeStatus = createAsyncThunk(
  'comments/getBatchLikeStatus',
  async (commentIds: string[], { rejectWithValue }) => {
    try {
      const response = await commentApi.getBatchLikeStatus(commentIds)
      return response.data // { [commentId]: { totalLikes, userHasLiked } }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: { message?: string } } }
      }
      return rejectWithValue(
        err.response?.data?.error?.message || 'Failed to get batch like status'
      )
    }
  }
)

/**
 * Ensure comment entry exists in byId state
 * Prevents silent no-op when updating non-existent entries
 */
function ensureCommentEntry(state: CommentState, commentId: string) {
  if (!state.byId[commentId]) {
    state.byId[commentId] = {}
  }
}

/**
 * Redux Slice
 */
const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    // Reset comment state
    resetCommentState: () => {
      return initialState
    },
    // Clear error
    clearCommentError: state => {
      state.error = null
    },
    /**
     * Initialize comment pin and basic state from fetched API data
     * Called when comments are loaded to populate Redux state with
     * pin status from the API response
     */
    initializeCommentsFromFetch: (
      state,
      action: PayloadAction<
        Array<{
          comment: {
            id: string
            isPinned?: boolean
            likeCount?: number
          }
          replies?: Array<{
            comment: {
              id: string
              isPinned?: boolean
              likeCount?: number
            }
          }>
        }>
      >
    ) => {
      // Update main comments
      action.payload.forEach(commentData => {
        const commentId = commentData.comment.id
        ensureCommentEntry(state, commentId)

        // Update isPinned and likeCount from API response
        if (commentData.comment.isPinned !== undefined) {
          state.byId[commentId].isPinned = commentData.comment.isPinned
        }
        if (commentData.comment.likeCount !== undefined) {
          state.byId[commentId].likeCount = commentData.comment.likeCount
        }

        // Update replies
        if (commentData.replies && commentData.replies.length > 0) {
          commentData.replies.forEach(replyData => {
            const replyId = replyData.comment.id
            ensureCommentEntry(state, replyId)

            if (replyData.comment.isPinned !== undefined) {
              state.byId[replyId].isPinned = replyData.comment.isPinned
            }
            if (replyData.comment.likeCount !== undefined) {
              state.byId[replyId].likeCount = replyData.comment.likeCount
            }
          })
        }
      })
    },
  },
  extraReducers: builder => {
    // ===== PIN COMMENT =====
    builder
      .addCase(asyncPinComment.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(asyncPinComment.fulfilled, (state, action) => {
        state.loading = false
        const { commentId, isPinned } = action.payload
        ensureCommentEntry(state, commentId)
        state.byId[commentId].isPinned = isPinned
        state.byId[commentId].pinLoading = false
        state.byId[commentId].pinError = null
      })
      .addCase(asyncPinComment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        // Update pin error for specific comment if we have the ID
        // This is a fallback for general error state
      })

    // ===== UNPIN COMMENT =====
    builder
      .addCase(asyncUnpinComment.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(asyncUnpinComment.fulfilled, (state, action) => {
        state.loading = false
        const { commentId, isPinned } = action.payload
        ensureCommentEntry(state, commentId)
        state.byId[commentId].isPinned = isPinned
        state.byId[commentId].pinLoading = false
        state.byId[commentId].pinError = null
      })
      .addCase(asyncUnpinComment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // ===== TOGGLE LIKE COMMENT =====
    builder
      .addCase(asyncToggleLikeComment.pending, (state, action) => {
        const commentId = action.meta.arg
        ensureCommentEntry(state, commentId)
        state.byId[commentId].likeLoading = true
      })
      .addCase(asyncToggleLikeComment.fulfilled, (state, action) => {
        const { commentId, liked, totalLikes } = action.payload
        ensureCommentEntry(state, commentId)
        state.byId[commentId].userHasLiked = liked
        state.byId[commentId].likeCount = totalLikes
        state.byId[commentId].likeLoading = false
        state.byId[commentId].likeError = null
      })
      .addCase(asyncToggleLikeComment.rejected, (state, action) => {
        state.error = action.payload as string
        // The likeLoading will be reset by ensuring entry exists
      })

    // ===== GET COMMENT LIKE STATUS =====
    builder.addCase(asyncGetCommentLikeStatus.fulfilled, (state, action) => {
      const { commentId, totalLikes, userHasLiked } = action.payload
      ensureCommentEntry(state, commentId)
      state.byId[commentId].likeCount = totalLikes
      state.byId[commentId].userHasLiked = userHasLiked
    })

    // ===== GET BATCH LIKE STATUS =====
    builder.addCase(asyncGetBatchLikeStatus.fulfilled, (state, action) => {
      const batchResult = action.payload
      for (const [commentId, likeStatus] of Object.entries(batchResult)) {
        if (likeStatus) {
          ensureCommentEntry(state, commentId)
          state.byId[commentId].likeCount = (
            likeStatus as CommentLikeStatus
          ).totalLikes
          state.byId[commentId].userHasLiked = (
            likeStatus as CommentLikeStatus
          ).userHasLiked
        }
      }
    })
  },
})

// Selectors
export const selectCommentById =
  (commentId: string) => (state: { comments: CommentState }) => {
    return state.comments.byId[commentId]
  }

export const selectCommentsPinAndLikeState =
  (commentIds: string[]) => (state: { comments: CommentState }) => {
    return commentIds.reduce(
      (acc, id) => ({
        ...acc,
        [id]: state.comments.byId[id] || {},
      }),
      {} as Record<string, unknown>
    )
  }

export const selectCommentsLoading = (state: { comments: CommentState }) => {
  return state.comments.loading
}

export const selectCommentsError = (state: { comments: CommentState }) => {
  return state.comments.error
}

export const {
  resetCommentState,
  clearCommentError,
  initializeCommentsFromFetch,
} = commentSlice.actions
export default commentSlice.reducer
