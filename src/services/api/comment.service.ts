import { apiClient } from '@/config/axios.config'
import type {
  Comment,
  CreateCommentPayload,
  CommentWithUser,
  CommentWithReplies,
} from '@/types/comment.types'

export interface CommentLikeResponse {
  liked: boolean
  totalLikes: number
}

export interface CommentLikeStatus {
  totalLikes: number
  userHasLiked: boolean
}

export interface CommentPinResponse {
  commentId: string
  isPinned: boolean
  pinnedByAdminId?: string | null
  pinnedAt?: string | null
}

class CommentAPI {
  private baseURL = '/comments'

  async create(
    payload: CreateCommentPayload
  ): Promise<{ success: boolean; data: Comment }> {
    const res = await apiClient.post(`${this.baseURL}`, payload)
    return res.data
  }

  async listByLesson(
    lessonId: string
  ): Promise<{ success: boolean; data: CommentWithReplies[] }> {
    const res = await apiClient.get(`${this.baseURL}/lesson/${lessonId}`)
    return res.data
  }

  async listByProblem(
    problemId: string
  ): Promise<{ success: boolean; data: CommentWithReplies[] }> {
    const res = await apiClient.get(`${this.baseURL}/problem/${problemId}`)
    return res.data
  }

  async getReplies(
    commentId: string
  ): Promise<{ success: boolean; data: CommentWithUser[] }> {
    const res = await apiClient.get(`${this.baseURL}/${commentId}/replies`)
    return res.data
  }

  async update(
    id: string,
    content: string
  ): Promise<{ success: boolean; data: Comment }> {
    const res = await apiClient.put(`${this.baseURL}/${id}`, { content })
    return res.data
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const res = await apiClient.delete(`${this.baseURL}/${id}`)
    return res.data
  }

  /**
   * Pin a comment (admin only)
   * POST /comments/:id/pin
   */
  async pinComment(
    commentId: string
  ): Promise<{ success: boolean; data: CommentPinResponse }> {
    const res = await apiClient.post(`${this.baseURL}/${commentId}/pin`)
    return res.data
  }

  /**
   * Unpin a comment (admin only)
   * DELETE /comments/:id/pin
   */
  async unpinComment(
    commentId: string
  ): Promise<{ success: boolean; data: CommentPinResponse }> {
    const res = await apiClient.delete(`${this.baseURL}/${commentId}/pin`)
    return res.data
  }

  /**
   * Toggle like on a comment
   * POST /comments/:id/like
   */
  async toggleLikeComment(
    commentId: string
  ): Promise<{ success: boolean; data: CommentLikeResponse }> {
    const res = await apiClient.post(`${this.baseURL}/${commentId}/like`)
    return res.data
  }

  /**
   * Get like status for a single comment
   * GET /comments/:id/like-status
   */
  async getCommentLikeStatus(
    commentId: string
  ): Promise<{ success: boolean; data: CommentLikeStatus }> {
    const res = await apiClient.get(`${this.baseURL}/${commentId}/like-status`)
    return res.data
  }

  /**
   * Get batch like status for multiple comments
   * GET /comments/like-status/batch?ids=id1,id2,...
   */
  async getBatchLikeStatus(
    commentIds: string[]
  ): Promise<{ success: boolean; data: Record<string, CommentLikeStatus> }> {
    const ids = commentIds.join(',')
    const res = await apiClient.get(
      `${this.baseURL}/like-status/batch?ids=${encodeURIComponent(ids)}`
    )
    return res.data
  }
}

export const commentApi = new CommentAPI()
