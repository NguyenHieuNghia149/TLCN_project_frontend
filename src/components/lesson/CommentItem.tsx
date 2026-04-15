import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '@/store/stores'
import {
  asyncToggleLikeComment,
  asyncPinComment,
  asyncUnpinComment,
  selectCommentById,
} from '@/store/slices/commentSlice'
import type { CommentWithUser } from '@/types/comment.types'
import {
  Edit2,
  Trash2,
  Send,
  Reply as ReplyIcon,
  ChevronDown,
  ChevronUp,
  Heart,
  Pin,
} from 'lucide-react'

interface CommentItemProps {
  commentData: CommentWithUser
  parentId?: string
  replies?: CommentWithUser[]
  auth: RootState['auth']['session']
  editingId: string | null
  editingContent: string
  replyingTo: string | null
  expandedReplies: Set<string>
  submitting: boolean
  onEdit: (id: string, currentContent: string) => void
  onSaveEdit: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReplyClick: (commentId: string) => void
  onReplyCancel: () => void
  onRepliesToggle: (commentId: string) => void
  onEditingContentChange: (content: string) => void
  onEditingCancel: () => void
  onReplySubmit: (e: React.FormEvent, parentCommentId: string) => Promise<void>
  onReplyContentChange: (content: string) => void
  replyContent: string
  renderChildComments?: (
    reply: CommentWithUser,
    parentId: string
  ) => React.ReactNode
}

const CommentItem: React.FC<CommentItemProps> = ({
  commentData,
  parentId,
  replies = [],
  auth,
  editingId,
  editingContent,
  replyingTo,
  expandedReplies,
  submitting,
  onEdit,
  onSaveEdit,
  onDelete,
  onReplyClick,
  onReplyCancel,
  onRepliesToggle,
  onEditingContentChange,
  onEditingCancel,
  onReplySubmit,
  onReplyContentChange,
  replyContent,
  renderChildComments,
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { comment, user } = commentData
  const isEditing = editingId === comment.id
  const canEdit =
    auth.isAuthenticated &&
    (auth.user?.id === comment.userId ||
      (auth.user?.role && ['owner', 'teacher'].includes(auth.user.role)))

  // Fetch comment state from Redux
  const commentState = useSelector((state: RootState) =>
    selectCommentById(comment.id)(state)
  )
  const isPinned = commentState?.isPinned ?? false
  const userHasLiked = commentState?.userHasLiked ?? false
  const likeCount = commentState?.likeCount ?? 0

  const handleToggleLike = async () => {
    if (!auth.isAuthenticated) {
      alert('Please log in to like comments')
      return
    }
    try {
      await dispatch(asyncToggleLikeComment(comment.id))
    } catch (err) {
      console.error('Failed to toggle like', err)
    }
  }

  const handlePinComment = async () => {
    try {
      await dispatch(asyncPinComment(comment.id))
    } catch (err) {
      console.error('Failed to pin comment', err)
    }
  }

  const handleUnpinComment = async () => {
    try {
      await dispatch(asyncUnpinComment(comment.id))
    } catch (err) {
      console.error('Failed to unpin comment', err)
    }
  }

  const getUserNameFromUser = (user: CommentWithUser['user']) => {
    if (!user) return 'Anonymous'
    if (user.firstName && user.lastName)
      return `${user.firstName} ${user.lastName}`
    if (user.firstName) return user.firstName
    if (user.lastName) return user.lastName
    return user.email
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      className={`rounded-lg border transition-colors hover:border-border/80 ${
        isPinned
          ? 'border-amber-400/50 bg-amber-50 dark:bg-amber-950/20'
          : 'border-border bg-card'
      }`}
    >
      {/* Pinned Badge */}
      {isPinned && (
        <div className="border-b border-amber-200/50 bg-amber-100/50 px-4 py-2 dark:bg-amber-950/50">
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <Pin className="h-3 w-3" />
            Pinned
          </div>
        </div>
      )}

      <div className="p-4">
        {/* User Info */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={getUserNameFromUser(user)}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <span className="text-xs font-semibold text-primary-foreground">
                  {getUserNameFromUser(user).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">
                {getUserNameFromUser(user)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Like Button */}
            {auth.isAuthenticated && !parentId && (
              <button
                onClick={handleToggleLike}
                className="inline-flex items-center gap-1 rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-red-500"
                title="Like this comment"
              >
                <Heart
                  className="h-4 w-4"
                  fill={userHasLiked ? 'currentColor' : 'none'}
                />
                <span className="text-xs">{likeCount}</span>
              </button>
            )}

            {/* Pin Button (admin only) */}
            {auth.isAuthenticated &&
              auth.user?.role &&
              ['owner', 'teacher'].includes(auth.user.role) &&
              !parentId && (
                <button
                  onClick={() =>
                    isPinned ? handleUnpinComment() : handlePinComment()
                  }
                  className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-amber-500"
                  title={isPinned ? 'Unpin this comment' : 'Pin this comment'}
                >
                  <Pin
                    className="h-4 w-4"
                    fill={isPinned ? 'currentColor' : 'none'}
                  />
                </button>
              )}

            {/* Edit/Delete Buttons */}
            {canEdit && (
              <>
                {auth.user?.id === comment.userId && (
                  <button
                    onClick={() => onEdit(comment.id, comment.content)}
                    className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-yellow-400"
                    title="Edit"
                    disabled={editingId !== null}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => onDelete(comment.id)}
                  className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  title="Delete"
                  disabled={editingId !== null}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              className="w-full rounded-lg border border-primary bg-input px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              rows={2}
              value={editingContent}
              onChange={e => onEditingContentChange(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={onEditingCancel}
                className="rounded px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={() => onSaveEdit(comment.id)}
                className="rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={submitting || !editingContent.trim()}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-foreground">
            {comment.content}
          </p>
        )}

        {/* Reply Button */}
        {auth.isAuthenticated && !parentId && (
          <div className="mt-3 flex gap-2">
            {replyingTo !== comment.id ? (
              <button
                onClick={() => onReplyClick(comment.id)}
                className="inline-flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
              >
                <ReplyIcon className="h-4 w-4" />
                Reply
              </button>
            ) : (
              <button
                onClick={onReplyCancel}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {/* Replies */}
        {!parentId && replies.length > 0 && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <button
              onClick={() => onRepliesToggle(comment.id)}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {expandedReplies.has(comment.id) ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide {replies.length} repl
                  {replies.length === 1 ? 'y' : 'ies'}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show {replies.length} repl
                  {replies.length === 1 ? 'y' : 'ies'}
                </>
              )}
            </button>

            {expandedReplies.has(comment.id) && (
              <div className="space-y-3 border-l-2 border-border pl-4">
                {replies.map(reply => renderChildComments?.(reply, comment.id))}
              </div>
            )}
          </div>
        )}

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <form
            onSubmit={e => onReplySubmit(e, comment.id)}
            className="mt-4 space-y-3 border-t border-border pt-4"
          >
            <textarea
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
              rows={2}
              value={replyContent}
              onChange={e => onReplyContentChange(e.target.value)}
              placeholder="Write a reply..."
              disabled={submitting}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onReplyCancel}
                className="rounded px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded bg-primary px-3 py-1 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={submitting || !replyContent.trim()}
              >
                <Send className="h-3 w-3" />
                Reply
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default CommentItem
