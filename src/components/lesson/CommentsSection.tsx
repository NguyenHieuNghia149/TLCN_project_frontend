import React, { useEffect, useState, useCallback } from 'react'
import { commentApi } from '@/services/api/comment.service'
import type { CommentWithUser } from '@/types/comment.types'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/stores'
import { MessageCircle, Edit2, Trash2, Send } from 'lucide-react'

interface Props {
  lessonId?: string
  problemId?: string
}

const CommentsSection: React.FC<Props> = ({ lessonId, problemId }) => {
  const contextId = lessonId || problemId
  const contextType = lessonId ? 'lesson' : 'problem'

  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
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
    } catch (err) {
      console.error('Failed to load comments', err)
    } finally {
      setLoading(false)
    }
  }, [contextId, contextType])

  useEffect(() => {
    if (!contextId) return
    fetchComments()
  }, [contextId, contextType])

  // Debug: log current user and comments
  useEffect(() => {
    console.log('Current auth user:', auth.user)
    console.log('Comments:', comments)
  }, [auth.user, comments])

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
      // Fetch to get user info
      await fetchComments()
      setContent('')
    } catch (err) {
      console.error('Failed to post comment', err)
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
      setComments(prev => prev.filter(c => c.comment.id !== id))
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const getUserName = (user: CommentWithUser['user']) => {
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
    <section className="mt-10 rounded-lg border border-gray-800 bg-[#1a1b23] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <MessageCircle className="h-5 w-5 text-blue-400" />
        <h3 className="text-xl font-semibold text-white">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      {auth.isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            className="w-full rounded-lg border border-gray-700 bg-[#252730] px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            disabled={submitting}
          />
          <div className="mt-3 flex justify-end">
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              disabled={submitting || !content.trim()}
            >
              <Send className="h-4 w-4" />
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-lg border border-gray-700 bg-[#252730] p-4 text-center">
          <p className="text-gray-400">
            <a href="/login" className="text-blue-400 hover:underline">
              Log in
            </a>{' '}
            to post comments.
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-[#252730] p-8 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-gray-600 opacity-50" />
          <p className="mt-2 text-gray-500">
            No comments yet. Be the first to comment!
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {comments.map(({ comment, user }) => (
            <li
              key={comment.id}
              className="rounded-lg border border-gray-700 bg-[#252730] p-4 transition-colors hover:border-gray-600"
            >
              {/* User Info */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={getUserName(user)}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                      <span className="text-xs font-semibold text-white">
                        {getUserName(user).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-white">
                      {getUserName(user)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                {auth.isAuthenticated &&
                  (auth.user?.id === comment.userId ||
                    (auth.user?.role &&
                      ['owner', 'teacher'].includes(auth.user.role))) && (
                    <div className="flex gap-2">
                      {auth.user?.id === comment.userId && (
                        <button
                          onClick={() =>
                            handleEdit(comment.id, comment.content)
                          }
                          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-yellow-400"
                          title="Edit"
                          disabled={editingId !== null}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-700 hover:text-red-400"
                        title="Delete"
                        disabled={editingId !== null}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
              </div>

              {/* Comment Content */}
              {editingId === comment.id ? (
                <div className="space-y-3">
                  <textarea
                    className="w-full rounded-lg border border-blue-500 bg-[#1a1b23] px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={2}
                    value={editingContent}
                    onChange={e => setEditingContent(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded px-3 py-1 text-sm text-gray-400 transition-colors hover:bg-gray-700"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(comment.id)}
                      className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                      disabled={submitting || !editingContent.trim()}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-gray-200">
                  {comment.content}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default CommentsSection
