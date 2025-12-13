import React, { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  GraduationCap,
} from 'lucide-react'
import './ManageTeacher.scss'
import { apiClient } from '@/config/axios.config'

interface ApiResponse {
  data?: {
    data?: Array<ApiUserData>
    pagination?: { total?: number }
  }
}

interface ApiUserData {
  id: string
  firstName?: string
  lastName?: string
  email: string
  status?: 'active' | 'banned'
  createdAt?: string
  gender?: string
  dateOfBirth?: string
  lastLoginAt?: string
}

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  createdAt?: string
  status?: 'active' | 'banned'
  gender?: string
  dateOfBirth?: string
  lastLoginAt?: string
}

const PAGE_SIZE = 10

const ManageTeacher: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [query, setQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [showForm, setShowForm] = useState<boolean>(false)
  const [editing, setEditing] = useState<UserItem | null>(null)

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await apiClient.get<ApiResponse>('/admin/teachers', {
          params: { page, limit: PAGE_SIZE },
        })
        const payload = res.data?.data || res.data
        const userData = Array.isArray(payload) ? payload : payload.data || []
        const items: UserItem[] = (userData as ApiUserData[]).map(
          (u: ApiUserData) => ({
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            email: u.email,
            role: 'teacher',
            status: u.status || 'active',
            createdAt: u.createdAt,
            gender: u.gender,
            dateOfBirth: u.dateOfBirth,
            lastLoginAt: u.lastLoginAt,
          })
        )
        setUsers(items)
      } catch (error) {
        const err = error as { response?: { data?: { message?: string } } }
        setError(err?.response?.data?.message || 'Failed to fetch teachers')
      } finally {
        setLoading(false)
      }
    }
    fetchTeachers()
  }, [page])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(u =>
      [u.name, u.email].some(v => v?.toLowerCase().includes(q))
    )
  }, [users, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const onCreate = () => {
    setEditing(null)
    setShowForm(true)
  }

  const onEdit = (u: UserItem) => {
    setEditing(u)
    setShowForm(true)
  }

  const onDelete = async (u: UserItem) => {
    if (!confirm(`Delete teacher ${u.name}?`)) return
    try {
      await apiClient.delete(`/admin/users/${u.id}`)
      setUsers(prev => prev.filter(x => x.id !== u.id))
    } catch {
      alert('Delete failed')
    }
  }

  const submitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const firstName = String(form.get('firstName') || '')
    const lastName = String(form.get('lastName') || '')
    const email = String(form.get('email') || '')
    const status = String(form.get('status') || 'active') as 'active' | 'banned'
    const password = String(form.get('password') || '')
    const gender = String(form.get('gender') || '') || undefined
    const dateOfBirthStr = String(form.get('dateOfBirth') || '')
    const dateOfBirth = dateOfBirthStr
      ? new Date(dateOfBirthStr).toISOString()
      : undefined

    try {
      if (editing) {
        const res = await apiClient.put(`/admin/teachers/${editing.id}`, {
          email,
          status,
          firstName,
          lastName,
          role: 'teacher',
          gender,
          dateOfBirth,
        })
        const u = (res.data?.data || res.data) as ApiUserData
        const updated: UserItem = {
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          email: u.email,
          role: 'teacher',
          status: u.status || 'active',
          createdAt: u.createdAt,
          gender: u.gender,
          dateOfBirth: u.dateOfBirth,
          lastLoginAt: u.lastLoginAt,
        }
        setUsers(prev => prev.map(x => (x.id === editing.id ? updated : x)))
      } else {
        const res = await apiClient.post(`/admin/teachers`, {
          email,
          password,
          status,
          firstName,
          lastName,
          gender,
          dateOfBirth,
        })
        const u = (res.data?.data || res.data) as ApiUserData
        const created: UserItem = {
          id: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          email: u.email,
          role: 'teacher',
          status: u.status || 'active',
          createdAt: u.createdAt,
          gender: u.gender,
          dateOfBirth: u.dateOfBirth,
          lastLoginAt: u.lastLoginAt,
        }
        setUsers(prev => [created, ...prev])
      }
      setShowForm(false)
      setEditing(null)
    } catch {
      alert('Save failed')
    }
  }

  return (
    <div className="admin-manage">
      <div className="admin-manage__header">
        <div className="admin-manage__title">
          <GraduationCap size={24} />
          <h1>Manage Teachers</h1>
        </div>
        <div className="admin-manage__actions">
          <div className="admin-manage__search">
            <Search size={16} />
            <input
              placeholder="Search by name or email..."
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
            New Teacher
          </button>
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-empty">Loading...</div>
        ) : error ? (
          <div className="admin-empty error">{error}</div>
        ) : paginated.length === 0 ? (
          <div className="admin-empty">No teachers found</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.gender || '-'}</td>
                  <td>
                    {u.dateOfBirth
                      ? new Date(u.dateOfBirth).toLocaleDateString()
                      : '-'}
                  </td>
                  <td>
                    <span
                      className={`badge ${u.status === 'active' ? 'badge--green' : 'badge--gray'}`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td>
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleString()
                      : '-'}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="icon-btn"
                        onClick={() => onEdit(u)}
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => onDelete(u)}
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
            <h3>{editing ? 'Edit Teacher' : 'Create Teacher'}</h3>
            <form onSubmit={submitForm} className="form-grid">
              <label>
                <span>First name</span>
                <input
                  name="firstName"
                  defaultValue={editing?.name?.split(' ')[0] || ''}
                  required
                />
              </label>
              <label>
                <span>Last name</span>
                <input
                  name="lastName"
                  defaultValue={
                    editing?.name?.split(' ').slice(1).join(' ') || ''
                  }
                  required
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  defaultValue={editing?.email || ''}
                  required
                />
              </label>
              <label>
                <span>Gender</span>
                <select name="gender" defaultValue={editing?.gender || ''}>
                  <option value="">(not set)</option>
                  <option value="male">male</option>
                  <option value="female">female</option>
                  <option value="other">other</option>
                </select>
              </label>
              <label>
                <span>Date of Birth</span>
                <input
                  type="date"
                  name="dateOfBirth"
                  defaultValue={
                    editing?.dateOfBirth
                      ? new Date(editing.dateOfBirth).toISOString().slice(0, 10)
                      : ''
                  }
                />
              </label>
              <label>
                <span>Role</span>
                <input value="teacher" disabled readOnly />
              </label>
              <label>
                <span>Status</span>
                <select
                  name="status"
                  defaultValue={editing?.status || 'active'}
                >
                  <option value="active">active</option>
                  <option value="banned">banned</option>
                </select>
              </label>
              {!editing && (
                <label>
                  <span>Password</span>
                  <input
                    type="password"
                    name="password"
                    minLength={8}
                    required
                  />
                </label>
              )}

              <div className="modal__actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageTeacher
