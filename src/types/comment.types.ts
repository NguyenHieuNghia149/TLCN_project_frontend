export interface CommentUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  avatar: string | null
  role?: string
}

export interface Comment {
  id: string
  content: string
  userId: string
  lessonId?: string | null
  problemId?: string | null
  parentCommentId?: string | null
  createdAt: string
  updatedAt: string
}

export interface CommentWithUser {
  comment: Comment
  user: CommentUser | null
}

export interface CommentWithReplies extends CommentWithUser {
  replies: CommentWithUser[]
}

export interface CommentListResponse {
  success: boolean
  data: CommentWithReplies[]
}

export interface CreateCommentPayload {
  content: string
  lessonId?: string
  problemId?: string
  parentCommentId?: string
}
