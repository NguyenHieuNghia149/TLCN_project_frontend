import React, { useState } from 'react'
import { useProfile } from '../../hooks/api/useProfile'
import { UpdateProfileData } from '@/types/profile.types'
import '../../pages/profile/Profile.css'
import { API_CONFIG } from '../../config/api.config'
import { tokenManager } from '../../services/auth/token.service'

const Profile: React.FC = () => {
  const { profile, loading, error, updateProfile, refetch } = useProfile()
  const [showEditModal, setShowEditModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Parse names for display
  const firstName = profile?.firstName || 'User'
  const lastName = profile?.lastName || ''
  const fullName = profile ? `${firstName} ${lastName}`.trim() : 'User'

  // Generate avatar URL based on profile
  const getAvatarUrl = () => {
    if (profile?.avatar) return profile.avatar
    // Generate a seed from email or id
    const seed = profile?.email || profile?.id || 'User'
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state">Loading profile...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="error-state">Error: {error}</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="error-state">No profile data available</div>
      </div>
    )
  }

  const stats = profile.statistics

  const handleEditClick = () => {
    setShowEditModal(true)
    setUpdateError(null)
  }

  const handleCloseModal = () => {
    setShowEditModal(false)
    setUpdateError(null)
  }

  // Upload avatar file to server; server should return cloudinary url
  const uploadAvatar = async (file: File): Promise<string> => {
    try {
      const accessToken = tokenManager.getAccessToken()
      if (!accessToken) {
        throw new Error('Not authenticated. Please log in again.')
      }

      const fd = new FormData()
      fd.append('avatar', file)
      const uploadUrl = `${API_CONFIG.baseURL}/auth/profile/upload-avatar`

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenManager.getAccessToken()}`,
        },
        body: fd,
        credentials: 'include',
      })

      // Check if response is JSON
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned invalid format')
      }

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.message || 'Upload failed')
      }

      if (!json?.data?.avatar) {
        throw new Error('Upload response invalid: Missing avatar URL')
      }

      return json.data.avatar as string
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Avatar upload failed: ${error.message}`)
      }
      throw new Error('Avatar upload failed: Unknown error')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsUpdating(true)
    setUpdateError(null)

    try {
      const form = e.currentTarget
      const formData = new FormData(form)
      const updateData: UpdateProfileData = {}

      // Get form values
      const firstName = (formData.get('firstName') as string)?.trim()
      const lastName = (formData.get('lastName') as string)?.trim()
      // Get file from input element (more reliable)
      const avatarInput = form.elements.namedItem(
        'avatar'
      ) as HTMLInputElement | null
      const avatarFile =
        avatarInput?.files && avatarInput.files.length > 0
          ? (avatarInput.files[0] as File)
          : null
      const gender = (formData.get('gender') as string)?.trim()
      const dateOfBirthValue = (formData.get('dateOfBirth') as string)?.trim()

      // Only include non-empty values
      if (firstName) {
        updateData.firstName = firstName
      }
      if (lastName) {
        updateData.lastName = lastName
      }
      // If user selected a new avatar file, upload it first and use returned URL
      if (avatarFile && avatarFile.size) {
        try {
          const uploadUrl = await uploadAvatar(avatarFile)
          if (uploadUrl) updateData.avatar = uploadUrl
        } catch (upErr) {
          throw new Error(
            upErr instanceof Error
              ? upErr.message
              : 'Avatar upload failed - please try again'
          )
        }
      }
      if (
        gender &&
        (gender === 'male' || gender === 'female' || gender === 'other')
      ) {
        updateData.gender = gender as 'male' | 'female' | 'other'
      }
      if (dateOfBirthValue) {
        updateData.dateOfBirth = new Date(dateOfBirthValue).toISOString()
      }

      await updateProfile(updateData)
      setShowEditModal(false)
      await refetch()
    } catch (err) {
      setUpdateError(
        err instanceof Error ? err.message : 'Failed to update profile'
      )
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-grid">
        {/* Left Sidebar */}
        <aside className="profile-sidebar card">
          <div className="profile-card__header">
            <div className="profile-avatar">
              <img src={getAvatarUrl()} alt={fullName} />
            </div>
            <div className="profile-identity">
              <div className="profile-name">{fullName}</div>
              <div className="profile-email">{profile.email}</div>
            </div>
          </div>
          <button className="edit-btn" onClick={handleEditClick}>
            Edit Profile
          </button>

          <Section title="Submission Stats">
            <div className="kv">
              <Row label="Total Submissions" value={stats.totalSubmissions} />
              <Row label="Accepted" value={stats.acceptedSubmissions} />
              <Row label="Wrong Answer" value={stats.wrongAnswerSubmissions} />
              <Row label="Problems Solved" value={stats.totalProblemsSolved} />
              <Row
                label="Problems Attempted"
                value={stats.totalProblemsAttempted}
              />
              <Row
                label="Acceptance Rate"
                value={`${stats.acceptanceRate.toFixed(2)}%`}
              />
            </div>
          </Section>

          <Section title="Error Statistics">
            <div className="kv">
              <Row
                label="Compilation Errors"
                value={stats.compilationErrorSubmissions}
              />
              <Row
                label="Runtime Errors"
                value={stats.runtimeErrorSubmissions}
              />
              <Row
                label="Memory Limit"
                value={stats.memoryLimitExceededSubmissions}
              />
              <Row
                label="Time Limit"
                value={stats.timeLimitExceededSubmissions}
              />
            </div>
          </Section>

          <Section title="Performance">
            <div className="kv">
              <Row
                label="Total Problems Attempted"
                value={stats.totalProblemsAttempted}
              />
              <Row label="Problems Solved" value={stats.totalProblemsSolved} />
              <Row
                label="Success Rate"
                value={`${stats.acceptanceRate.toFixed(2)}%`}
              />
            </div>
          </Section>
        </aside>

        {/* Main Content */}
        <div className="profile-main">
          {/* Top summary cards */}
          <div className="summary-row">
            <div className="summary-card card">
              <div className="summary-header">
                <div className="circle-meter">{stats.totalProblemsSolved}</div>
                <div className="legend">
                  <div className="legend-row easy">
                    Accepted <span>{stats.acceptedSubmissions}</span>
                  </div>
                  <div className="legend-row medium">
                    TLE <span>{stats.timeLimitExceededSubmissions}</span>
                  </div>
                  <div className="legend-row hard">
                    RE <span>{stats.runtimeErrorSubmissions}</span>
                  </div>
                </div>
              </div>
              <div className="attempting">
                {stats.totalSubmissions - stats.acceptedSubmissions}{' '}
                Non-accepted submissions
              </div>
            </div>

            <div className="badges-card card">
              <div className="badges-header">
                <div className="badges-title">Badges</div>
                <div className="badges-count">0</div>
              </div>
              <div className="locked-badge">
                Locked Badge
                <br />
                Sep LeetCoding Challenge
              </div>
            </div>
          </div>

          {/* Heatmap and Recent Panel */}
          <div className="heatmap card">
            <div className="heatmap-header">
              <div>{stats.totalSubmissions} total submissions</div>
              <div className="muted">
                Problems solved: {stats.totalProblemsSolved} · Acceptance rate:{' '}
                {stats.acceptanceRate.toFixed(2)}%
              </div>
            </div>
            <div className="heatmap-grid" aria-hidden>
              {/* placeholder blocks */}
              {Array.from({ length: 70 }).map((_, i) => (
                <span className="heat-dot" key={i} />
              ))}
            </div>
            <div className="months">
              {[
                'Oct',
                'Nov',
                'Dec',
                'Jan',
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
              ].map(m => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>

          <div className="recent-panel card">
            <div className="tabs">
              <button className="tab active">Recent AC</button>
              <button className="tab">List</button>
              <button className="tab">Solutions</button>
              <button className="tab">Discuss</button>
              <a className="view-all" href="#">
                View all submissions ›
              </a>
            </div>
            <div className="empty-state">
              <div className="empty-illus">
                {stats.totalSubmissions === 0
                  ? 'Null'
                  : `✓ ${stats.acceptedSubmissions} Accepted`}
              </div>
              <div className="empty-note">
                {stats.totalSubmissions === 0
                  ? 'No recent submissions'
                  : `${stats.totalSubmissions} total submissions`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Edit Profile</h3>
            {updateError && (
              <div
                className="error-message"
                style={{ color: '#ef4444', marginBottom: '1rem' }}
              >
                {updateError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="form-grid">
              <label>
                <span>First Name</span>
                <input
                  name="firstName"
                  type="text"
                  defaultValue={profile.firstName || ''}
                  required
                />
              </label>
              <label>
                <span>Last Name</span>
                <input
                  name="lastName"
                  type="text"
                  defaultValue={profile.lastName || ''}
                  required
                />
              </label>
              <label>
                <span>Avatar</span>
                <input name="avatar" type="file" accept="image/*" />
              </label>
              <label>
                <span>Gender</span>
                <select name="gender" defaultValue={profile.gender || ''}>
                  <option value="">(not set)</option>
                  <option value="male">male</option>
                  <option value="female">female</option>
                  <option value="other">other</option>
                </select>
              </label>
              <label>
                <span>Date of Birth</span>
                <input
                  name="dateOfBirth"
                  type="date"
                  defaultValue={
                    profile.dateOfBirth
                      ? new Date(profile.dateOfBirth)
                          .toISOString()
                          .split('T')[0]
                      : ''
                  }
                />
              </label>
              <div className="modal__actions">
                <button
                  type="button"
                  className="btn"
                  onClick={handleCloseModal}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="section">
    <div className="section-title">{title}</div>
    <div className="section-body">{children}</div>
  </div>
)

const Row: React.FC<{
  label: string
  value: number | string
  note?: string
}> = ({ label, value, note }) => (
  <div className="row">
    <div className="row-label">{label}</div>
    <div className="row-value">{value}</div>
    {note && <div className="row-note">{note}</div>}
  </div>
)

export default Profile
