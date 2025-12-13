import React, { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import './ManageTopic.scss'
import adminTopicAPI, {
  AdminTopicResponse,
} from '@/services/api/adminTopic.service'

interface TopicItem {
  id: string
  topicName: string
  createdAt?: string
  updatedAt?: string
}

const PAGE_SIZE = 10

const ManageTopic: React.FC = () => {
  const [topics, setTopics] = useState<TopicItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [query, setQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [showForm, setShowForm] = useState<boolean>(false)
  const [editing, setEditing] = useState<TopicItem | null>(null)
  const [formData, setFormData] = useState<{ topicName: string }>({
    topicName: '',
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<TopicItem | null>(
    null
  )
  const [showDeleteVerify, setShowDeleteVerify] = useState<TopicItem | null>(
    null
  )
  const [deleteVerifyInput, setDeleteVerifyInput] = useState<string>('')
  const [topicStats, setTopicStats] = useState<{
    [key: string]: { totalLessons: number; totalProblems: number }
  }>({})

  // Fetch topics
  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true)
      setError('')
      try {
        const result = await adminTopicAPI.listTopics({
          page,
          limit: PAGE_SIZE,
          search: query || undefined,
        })
        const topicData = result.data.data || []
        const items: TopicItem[] = topicData.map((t: AdminTopicResponse) => ({
          id: t.id,
          topicName: t.topicName,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }))
        setTopics(items)

        // Fetch stats for each topic
        const stats: typeof topicStats = {}
        for (const item of items) {
          try {
            const statsResult = await adminTopicAPI.getTopicStats(item.id)
            stats[item.id] = {
              totalLessons: statsResult.data.totalLessons,
              totalProblems: statsResult.data.totalProblems,
            }
          } catch (err) {
            console.error(`Failed to fetch stats for topic ${item.id}:`, err)
          }
        }
        setTopicStats(stats)
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } }
        setError(err?.response?.data?.message || 'Failed to fetch topics')
      } finally {
        setLoading(false)
      }
    }
    fetchTopics()
  }, [page, query])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return topics
    return topics.filter(t => t.topicName.toLowerCase().includes(q))
  }, [topics, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const onCreate = () => {
    setEditing(null)
    setFormData({ topicName: '' })
    setShowForm(true)
  }

  const onEdit = (t: TopicItem) => {
    setEditing(t)
    setFormData({ topicName: t.topicName })
    setShowForm(true)
  }

  const onDeleteClick = (t: TopicItem) => {
    setShowDeleteConfirm(t)
  }

  const confirmDelete = (t: TopicItem) => {
    setShowDeleteConfirm(null)
    setShowDeleteVerify(t)
    setDeleteVerifyInput('')
  }

  const submitDelete = async () => {
    if (!showDeleteVerify) return

    if (deleteVerifyInput !== showDeleteVerify.topicName) {
      alert('Topic name does not match. Please check again.')
      return
    }

    try {
      await adminTopicAPI.deleteTopic(showDeleteVerify.id)
      setTopics(prev => prev.filter(x => x.id !== showDeleteVerify.id))
      setShowDeleteVerify(null)
      setDeleteVerifyInput('')
      setTopicStats(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [showDeleteVerify.id]: _unused, ...rest } = prev
        return rest
      })
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } }
      alert(err?.response?.data?.message || 'Unable to delete topic')
    }
  }

  const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const topicName = formData.topicName.trim()

    if (!topicName) {
      alert('Topic name cannot be empty')
      return
    }

    try {
      if (editing) {
        const result = await adminTopicAPI.updateTopic(editing.id, {
          topicName,
        })
        const t = result.data
        const updated: TopicItem = {
          id: t.id,
          topicName: t.topicName,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }
        setTopics(prev => prev.map(x => (x.id === editing.id ? updated : x)))
      } else {
        const result = await adminTopicAPI.createTopic({
          topicName,
        })
        const t = result.data
        const created: TopicItem = {
          id: t.id,
          topicName: t.topicName,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }
        setTopics(prev => [created, ...prev])

        // Fetch stats for new topic
        try {
          const statsResult = await adminTopicAPI.getTopicStats(created.id)
          setTopicStats(prev => ({
            ...prev,
            [created.id]: {
              totalLessons: statsResult.data.totalLessons,
              totalProblems: statsResult.data.totalProblems,
            },
          }))
        } catch (err) {
          console.error('Failed to fetch stats for new topic:', err)
        }
      }
      setShowForm(false)
      setEditing(null)
      setFormData({ topicName: '' })
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } }
      alert(err?.response?.data?.message || 'Unable to save topic')
    }
  }

  return (
    <div className="admin-manage">
      <div className="admin-manage__header">
        <div className="admin-manage__title">
          <h1>Manage Topics</h1>
        </div>
        <div className="admin-manage__actions">
          <button
            className="btn btn--primary"
            onClick={onCreate}
            disabled={loading}
          >
            <Plus size={20} />
            New Topic
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="admin-manage__search">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search topics..."
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setPage(1)
          }}
          disabled={loading}
        />
      </div>

      {loading && <div className="loading">Loading...</div>}

      {!loading && paginated.length === 0 && (
        <div className="admin-empty">
          <FileText size={48} />
          <p>No topics found</p>
        </div>
      )}

      {!loading && paginated.length > 0 && (
        <>
          <div className="admin-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Topic Name</th>
                  <th>Lessons</th>
                  <th>Problems</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => (
                  <tr key={t.id}>
                    <td className="topic-name">{t.topicName}</td>
                    <td className="stat-cell">
                      {topicStats[t.id]?.totalLessons || 0}
                    </td>
                    <td className="stat-cell">
                      {topicStats[t.id]?.totalProblems || 0}
                    </td>
                    <td className="action-cell">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => onEdit(t)}
                        title="Edit"
                        disabled={loading}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => onDeleteClick(t)}
                        title="Delete"
                        disabled={loading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination">
              <span className="admin-pagination__info">
                Page {page} / {totalPages}
              </span>
              <div className="admin-pagination__controls">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <div
          className="modal-overlay"
          onClick={() => !loading && setShowForm(false)}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Edit Topic' : 'Add New Topic'}</h2>
            <form onSubmit={submitForm}>
              <div className="form-group">
                <label htmlFor="topicName">Topic Name *</label>
                <input
                  id="topicName"
                  type="text"
                  value={formData.topicName}
                  onChange={e => setFormData({ topicName: e.target.value })}
                  placeholder="Enter Topic Name"
                  disabled={loading}
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={loading}
                >
                  {editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            className="modal-content modal-warning"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-icon">
              <AlertCircle size={48} />
            </div>
            <h2>Delete Topic</h2>
            <p>
              Are you sure you want to delete the topic{' '}
              <strong>"{showDeleteConfirm.topicName}"</strong>?
            </p>
            <p className="warning-text">
              ⚠️ This action will delete all lessons and problems in this topic.
              This cannot be undone!
            </p>
            <div className="modal-actions">
              <button
                className="btn btn--danger"
                onClick={() => confirmDelete(showDeleteConfirm)}
                disabled={loading}
              >
                Continue Delete
              </button>
              <button
                className="btn btn--secondary"
                onClick={() => setShowDeleteConfirm(null)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Verification Modal */}
      {showDeleteVerify && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteVerify(null)}
        >
          <div
            className="modal-content modal-verify"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-icon danger">
              <AlertCircle size={48} />
            </div>
            <h2>Confirm Delete</h2>
            <p>
              To confirm deleting the topic{' '}
              <strong>"{showDeleteVerify.topicName}"</strong>, please enter the
              Topic Name below:
            </p>
            <div className="form-group">
              <input
                type="text"
                value={deleteVerifyInput}
                onChange={e => setDeleteVerifyInput(e.target.value)}
                placeholder={`Enter "${showDeleteVerify.topicName}"`}
                disabled={loading}
                autoFocus
              />
            </div>
            {deleteVerifyInput === showDeleteVerify.topicName && (
              <div className="verify-status status-matched">
                <CheckCircle2 size={20} />
                <span>Topic name matches ✓</span>
              </div>
            )}
            {deleteVerifyInput &&
              deleteVerifyInput !== showDeleteVerify.topicName && (
                <div className="verify-status status-not-matched">
                  <AlertCircle size={20} />
                  <span>Topic name does not match</span>
                </div>
              )}
            <div className="modal-actions">
              <button
                className="btn btn--danger"
                onClick={submitDelete}
                disabled={
                  loading || deleteVerifyInput !== showDeleteVerify.topicName
                }
              >
                Delete Topic
              </button>
              <button
                className="btn btn--secondary"
                onClick={() => setShowDeleteVerify(null)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageTopic
