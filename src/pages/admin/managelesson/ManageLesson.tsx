import React, { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  BookOpen,
  Upload,
} from 'lucide-react'
import './ManageLesson.scss'
import {
  adminLessonAPI,
  AdminLessonResponse,
} from '@/services/api/adminLesson.service'
import { apiClient } from '@/config/axios.config'
import { parseDocxToHtml, isValidDocxFile } from '@/utils/parseDocx'

interface ApiTopicData {
  id: string
  topicName: string
}

interface LessonItem {
  id: string
  title: string
  content?: string | null
  videoUrl?: string | null
  topicId: string
  topicName?: string | null
  createdAt: string
  updatedAt: string
}

const PAGE_SIZE = 10

const ManageLesson: React.FC = () => {
  const [lessons, setLessons] = useState<LessonItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [query, setQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [showForm, setShowForm] = useState<boolean>(false)
  const [editing, setEditing] = useState<LessonItem | null>(null)
  const [topics, setTopics] = useState<ApiTopicData[]>([])
  const [uploadingFile, setUploadingFile] = useState<boolean>(false)
  const [contentFromFile, setContentFromFile] = useState<string>('')
  const [fileInputKey, setFileInputKey] = useState<number>(0)

  // Fetch topics on mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await apiClient.get<{
          success: boolean
          data: ApiTopicData[]
        }>('/topics')
        const topicsData = (res.data?.data || []) as ApiTopicData[]
        setTopics(topicsData)
      } catch (error) {
        console.error('Failed to fetch topics:', error)
      }
    }
    fetchTopics()
  }, [])

  // Fetch lessons
  useEffect(() => {
    const fetchLessons = async () => {
      setLoading(true)
      setError('')
      try {
        const result = await adminLessonAPI.listLessons({
          page,
          limit: PAGE_SIZE,
          search: query || undefined,
        })
        const lessonData = result.data.data || []
        const items: LessonItem[] = lessonData.map(
          (l: AdminLessonResponse) => ({
            id: l.id,
            title: l.title,
            content: l.content,
            videoUrl: l.videoUrl,
            topicId: l.topicId,
            topicName: l.topicName,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
          })
        )
        setLessons(items)
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } }
        setError(err?.response?.data?.message || 'Failed to fetch lessons')
      } finally {
        setLoading(false)
      }
    }
    fetchLessons()
  }, [page, query])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return lessons
    return lessons.filter(l =>
      [l.title, l.content, l.topicName].some(v => v?.toLowerCase().includes(q))
    )
  }, [lessons, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const onCreate = () => {
    setEditing(null)
    setShowForm(true)
    setContentFromFile('')
    setFileInputKey(prev => prev + 1)
  }

  const onEdit = (l: LessonItem) => {
    setEditing(l)
    setShowForm(true)
    setContentFromFile('')
    setFileInputKey(prev => prev + 1)
  }

  const onDelete = async (l: LessonItem) => {
    if (!confirm(`Delete lesson "${l.title}"?`)) return
    try {
      await adminLessonAPI.deleteLesson(l.id)
      setLessons(prev => prev.filter(x => x.id !== l.id))
    } catch {
      alert('Delete failed')
    }
  }

  const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const title = String(form.get('title') || '')
    const content = String(form.get('content') || '').trim()

    // Kiểm tra content không trống khi submit
    if (!content) {
      alert('Content is required')
      return
    }

    const videoUrl = String(form.get('videoUrl') || '') || undefined
    const topicId = String(form.get('topicId') || '')

    try {
      if (editing) {
        const result = await adminLessonAPI.updateLesson(editing.id, {
          title,
          content,
          videoUrl,
          topicId,
        })
        const l = result.data
        const updated: LessonItem = {
          id: l.id,
          title: l.title,
          content: l.content,
          videoUrl: l.videoUrl,
          topicId: l.topicId,
          topicName: l.topicName,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
        }
        setLessons(prev => prev.map(x => (x.id === editing.id ? updated : x)))
      } else {
        const result = await adminLessonAPI.createLesson({
          title,
          content,
          videoUrl,
          topicId,
        })
        const l = result.data
        const created: LessonItem = {
          id: l.id,
          title: l.title,
          content: l.content,
          videoUrl: l.videoUrl,
          topicId: l.topicId,
          topicName: l.topicName,
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
        }
        setLessons(prev => [created, ...prev])
      }
      setShowForm(false)
      setEditing(null)
      setContentFromFile('')
    } catch {
      alert('Save failed')
    }
  }

  const handleWordFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    if (!isValidDocxFile(file)) {
      alert('File không hợp lệ. Vui lòng chọn file .docx')
      setFileInputKey(prev => prev + 1)
      return
    }

    setUploadingFile(true)
    try {
      console.log('Parsing file with Mammoth:', file.name)

      // Client-side parsing using Mammoth - xử lý hoàn toàn trên frontend
      const { html, error } = await parseDocxToHtml(file)

      if (error) {
        alert(error)
        return
      }

      if (html) {
        // Đã xử lý xong trên frontend, dùng trực tiếp
        // Upload file sẽ xoá content nhập tay trước đó
        setContentFromFile(html)
        alert(`Content from "${file.name}" loaded successfully`)
      } else {
        alert('Không thể trích xuất nội dung từ file')
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Lỗi khi xử lý file'
      console.error('Processing error:', error)
      alert(errorMessage)
    } finally {
      setUploadingFile(false)
      // Reset file input
      setFileInputKey(prev => prev + 1)
    }
  }

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Khi user nhập text, xoá content từ file
    setContentFromFile(e.currentTarget.value)
  }

  return (
    <div className="admin-manage">
      <div className="admin-manage__header">
        <div className="admin-manage__title">
          <BookOpen size={24} />
          <h1>Manage Lessons</h1>
        </div>
        <div className="admin-manage__actions">
          <div className="admin-manage__search">
            <Search size={16} />
            <input
              placeholder="Search by title, content, topic..."
              value={query}
              onChange={event => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </div>
          <button
            className="btn btn--secondary"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="btn btn--primary" onClick={onCreate}>
            <Plus size={16} />
            New Lesson
          </button>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : error ? (
          <div className="admin-empty error">{error}</div>
        ) : paginated.length === 0 ? (
          <div className="admin-empty">No lessons found</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Topic</th>
                <th>Content Preview</th>
                <th>Video URL</th>
                <th>Created At</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>{l.title}</td>
                  <td>
                    <span className="topic-badge">{l.topicName || '-'}</span>
                  </td>
                  <td>
                    <span className="content-preview">
                      {l.content ? l.content.substring(0, 50) + '...' : '-'}
                    </span>
                  </td>
                  <td>
                    {l.videoUrl ? (
                      <a
                        href={l.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link"
                      >
                        View
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="icon-btn"
                        onClick={() => onEdit(l)}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => onDelete(l)}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-pagination">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Edit Lesson' : 'Create Lesson'}</h3>
            <form onSubmit={submitForm} className="form-grid">
              <label>
                <span>Title *</span>
                <input
                  name="title"
                  defaultValue={editing?.title || ''}
                  placeholder="Enter lesson title"
                  required
                />
              </label>
              <label>
                <span>Topic *</span>
                <select
                  name="topicId"
                  defaultValue={editing?.topicId || ''}
                  required
                >
                  <option value="">Select a topic</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.topicName}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                <span>Content</span>
                <div className="file-upload-section">
                  <div className="file-upload-group">
                    <label
                      htmlFor={`word-file-${fileInputKey}`}
                      className="file-input-label"
                    >
                      <Upload size={16} />
                      {uploadingFile
                        ? 'Uploading...'
                        : 'Upload Word File (.docx/.doc)'}
                    </label>
                    <input
                      id={`word-file-${fileInputKey}`}
                      key={fileInputKey}
                      type="file"
                      accept=".docx,.doc"
                      onChange={handleWordFileUpload}
                      disabled={uploadingFile}
                      style={{ display: 'none' }}
                    />
                  </div>
                  {contentFromFile && (
                    <div className="file-loaded-indicator">
                      ✓ Content loaded from file
                      <button
                        type="button"
                        onClick={() => setContentFromFile('')}
                        className="clear-btn"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                <textarea
                  name="content"
                  value={contentFromFile || editing?.content || ''}
                  onChange={handleContentChange}
                  placeholder="Enter lesson content or upload Word file"
                  rows={6}
                />
                {contentFromFile && (
                  <div className="preview-section">
                    <details>
                      <summary>Preview content from file</summary>
                      <div
                        className="content-preview-html"
                        dangerouslySetInnerHTML={{
                          __html: contentFromFile.substring(0, 500) + '...',
                        }}
                      />
                    </details>
                  </div>
                )}
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                <span>Video URL</span>
                <input
                  type="url"
                  name="videoUrl"
                  defaultValue={editing?.videoUrl || ''}
                  placeholder="https://example.com/video.mp4"
                />
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageLesson
