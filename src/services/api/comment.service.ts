import { apiClient } from '@/config/axios.config'
import type {
  Comment,
  CreateCommentPayload,
  CommentWithUser,
  CommentWithReplies,
} from '@/types/comment.types'

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
}

export const commentApi = new CommentAPI()
