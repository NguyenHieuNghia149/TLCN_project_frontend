import React, { useEffect, useState, useCallback } from 'react'
import { commentApi } from '@/services/api/comment.service'
import type { CommentWithUser, CommentWithReplies } from '@/types/comment.types'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/store/stores'
import type { AppDispatch } from '@/store/stores'
import {
  asyncGetBatchLikeStatus,
  initializeCommentsFromFetch,
} from '@/store/slices/commentSlice'
import { MessageCircle, Send } from 'lucide-react'
import CommentItem from './CommentItem'

interface Props {
  lessonId?: string
  problemId?: string
}

const CommentsSection: React.FC<Props> = ({ lessonId, problemId }) => {
  const contextId = lessonId || problemId
  const contextType = lessonId ? 'lesson' : 'problem'
  const dispatch = useDispatch<AppDispatch>()

  const [comments, setComments] = useState<CommentWithReplies[]>([])
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())
  const auth = useSelector((state: RootState) => state.auth.session)

  const fetchComments = useCallback(async () => {
    if (!contextId) return
    setLoading(true)
    try {
      const data =
        contextType === 'lesson'
          ? (await commentApi.listByLesson(contextId)).data
          : (await commentApi.listByProblem(contextId)).data
      setComments(data)

      // Initialize Redux state with comment data (pin status, like count)
      dispatch(initializeCommentsFromFetch(data))

      // Batch fetch like status for all comments (to prevent N+1 queries)
      if (data.length > 0) {
        const allCommentIds = data.reduce(
          (acc, comment) => [
            ...acc,
            comment.comment.id,
            ...comment.replies.map(r => r.comment.id),
          ],
          [] as string[]
        )
        if (allCommentIds.length > 0) {
          dispatch(asyncGetBatchLikeStatus(allCommentIds))
        }
      }
    } catch (err) {
      console.error('Failed to load comments', err)
    } finally {
      setLoading(false)
    }
  }, [contextId, contextType, dispatch])

  useEffect(() => {
    if (!contextId) return
    fetchComments()
  }, [contextId, contextType, fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !contextId) return

    setSubmitting(true)
    try {
      await commentApi.create({
        content,
        ...(contextType === 'lesson'
          ? { lessonId: contextId }
          : { problemId: contextId }),
      })
      await fetchComments()
      setContent('')
    } catch (err) {
      console.error('Failed to post comment', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (e: React.FormEvent, parentCommentId: string) => {
    e.preventDefault()
    if (!replyContent.trim() || !contextId) return

    setSubmitting(true)
    try {
      await commentApi.create({
        content: replyContent,
        parentCommentId,
        ...(contextType === 'lesson'
          ? { lessonId: contextId }
          : { problemId: contextId }),
      })
      await fetchComments()
      setReplyContent('')
      setReplyingTo(null)
    } catch (err) {
      console.error('Failed to post reply', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (id: string, currentContent: string) => {
    setEditingId(id)
    setEditingContent(currentContent)
  }

  const handleSaveEdit = async (id: string) => {
    if (!editingContent.trim()) return

    setSubmitting(true)
    try {
      await commentApi.update(id, editingContent.trim())
      setEditingId(null)
      setEditingContent('')
      await fetchComments()
    } catch (err) {
      console.error('Failed to update comment', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    try {
      await commentApi.delete(id)
      await fetchComments()
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const toggleReplies = (commentId: string) => {
    const newExpanded = new Set(expandedReplies)
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId)
    } else {
      newExpanded.add(commentId)
    }
    setExpandedReplies(newExpanded)
  }

  const renderCommentItem = (
    commentData: CommentWithUser,
    parentId?: string,
    replies?: CommentWithUser[]
  ): React.JSX.Element => {
    return (
      <CommentItem
        key={commentData.comment.id}
        commentData={commentData}
        parentId={parentId}
        replies={replies}
        auth={auth}
        editingId={editingId}
        editingContent={editingContent}
        replyingTo={replyingTo}
        expandedReplies={expandedReplies}
        submitting={submitting}
        onEdit={handleEdit}
        onSaveEdit={handleSaveEdit}
        onDelete={handleDelete}
        onReplyClick={commentId => setReplyingTo(commentId)}
        onReplyCancel={() => setReplyingTo(null)}
        onRepliesToggle={toggleReplies}
        onEditingContentChange={setEditingContent}
        onEditingCancel={() => setEditingId(null)}
        onReplySubmit={handleReply}
        onReplyContentChange={setReplyContent}
        replyContent={replyContent}
        renderChildComments={reply =>
          renderCommentItem(reply, commentData.comment.id)
        }
      />
    )
  }

  return (
    <section className="mt-10 rounded-lg border border-border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold text-foreground">
          Comments (
          {comments.reduce(
            (acc, c) => acc + 1 + (c as CommentWithReplies).replies.length,
            0
          )}
          )
        </h3>
      </div>

      {/* Comment Form */}
      {auth.isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            className="w-full rounded-lg border border-border bg-input px-4 py-3 text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            rows={3}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            disabled={submitting}
          />
          <div className="mt-3 flex justify-end">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              disabled={submitting || !content.trim()}
            >
              <Send className="h-4 w-4" />
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-lg border border-border bg-muted/50 p-4 text-center">
          <p className="text-muted-foreground">
            <a href="/login" className="text-primary hover:underline">
              Log in
            </a>{' '}
            to post comments.
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
          <p className="mt-2 text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {comments
            .sort((a, b) => {
              // Pinned comments appear first
              if (a.comment.isPinned && !b.comment.isPinned) return -1
              if (!a.comment.isPinned && b.comment.isPinned) return 1
              return 0
            })
            .map(commentData =>
              renderCommentItem(commentData, undefined, commentData.replies)
            )}
        </ul>
      )}
    </section>
  )
}

export default CommentsSection
