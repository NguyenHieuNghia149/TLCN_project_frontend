import React, { useState, useEffect } from 'react'
import { useProfile } from '../../hooks/api/useProfile'
import { UpdateProfileData } from '../../services/api/profile.service'
import '../../pages/profile/Profile.css'
import { API_CONFIG } from '../../config/api.config'
import { tokenManager } from '../../services/auth/token.service'
import { submissionsService } from '../../services/api/submissions.service'
import type { SubmissionDetail } from '../../types/submission.types'

const Profile: React.FC = () => {
  const { profile, loading, error, updateProfile, refetch } = useProfile()
  const [showEditModal, setShowEditModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [recentSubmissions, setRecentSubmissions] = useState<
    SubmissionDetail[]
  >([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [contributionData, setContributionData] = useState<Map<string, number>>(
    new Map()
  )

  // Parse names for display
  const firstName = profile?.firstName || 'User'
  const lastName = profile?.lastName || ''
  const fullName = profile ? `${firstName} ${lastName}`.trim() : 'User'

  // Load recent submissions
  useEffect(() => {
    if (profile?.id) {
      loadRecentSubmissions()
      loadContributionData()
    }
  }, [profile?.id])

  const loadRecentSubmissions = async () => {
    try {
      setSubmissionsLoading(true)
      const response = await submissionsService.getUserSubmissions({
        limit: 10,
        offset: 0,
        status: 'ACCEPTED',
      })
      setRecentSubmissions(response.submissions.slice(0, 5))
    } catch (err) {
      console.error('Failed to load recent submissions:', err)
    } finally {
      setSubmissionsLoading(false)
    }
  }

  // Load contribution data for the last year
  const loadContributionData = async () => {
    try {
      // Fetch all submissions for the user (no status filter to get all data)
      const response = await submissionsService.getUserSubmissions({
        limit: 100,
        offset: 0,
      })

      // Build a map of contributions by date (YYYY-MM-DD)
      const contributionsMap = new Map<string, number>()

      response.submissions.forEach(submission => {
        if (submission.submittedAt) {
          const date = new Date(submission.submittedAt)
          const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
          contributionsMap.set(
            dateKey,
            (contributionsMap.get(dateKey) || 0) + 1
          )
        }
      })

      setContributionData(contributionsMap)
    } catch (err) {
      console.error('Failed to load contribution data:', err)
    }
  }

  // Calculate month positions for alignment
  const calculateMonthPositions = () => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 365)

    // Find the first Monday in or before the start date
    const dayOfWeek = startDate.getDay() // 0 = Sun, 1 = Mon, ... 6 = Sat
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate.setDate(startDate.getDate() - daysToMonday)

    const monthStarts = []
    const months = [
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
      'Oct',
      'Nov',
      'Dec',
    ]

    // Calculate which week each month starts
    for (let i = 0; i < months.length; i++) {
      const monthDate = new Date(today)
      if (i === 0) {
        // December of previous year
        monthDate.setFullYear(monthDate.getFullYear() - 1, 11, 1)
      } else {
        monthDate.setFullYear(today.getFullYear(), i - 1, 1)
      }

      // Calculate days between start date and this month start
      const diffTime = monthDate.getTime() - startDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const weekIndex = Math.floor(diffDays / 7)

      monthStarts.push({
        name: months[i],
        weekIndex: Math.max(0, weekIndex),
        position: Math.max(0, weekIndex) * 16, // 14px cell + 2px gap
      })
    }

    return monthStarts
  }

  // Calculate the grid dimensions
  const calculateGridDimensions = () => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - 365)

    // Find the first Monday
    const dayOfWeek = startDate.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate.setDate(startDate.getDate() - daysToMonday)

    // Calculate total days from start Monday to today
    const diffTime = today.getTime() - startDate.getTime()
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

    // Calculate weeks needed (including partial week)
    const weeksNeeded = Math.ceil(totalDays / 7)

    return { startDate, totalDays, weeksNeeded }
  }

  // Get color based on contribution count
  const getContributionColor = (count: number): string => {
    if (count === 0) return '#161b22'
    if (count === 1) return '#0e4429'
    if (count === 2) return '#006d32'
    if (count === 3) return '#26a641'
    return '#39d353'
  }

  // Format date for tooltip
  const formatContributionTooltip = (date: Date, count: number): string => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const monthName = date.toLocaleDateString('en-US', { month: 'short' })
    const dayNum = date.getDate()

    if (count === 0) {
      return `No contributions on ${dayName}, ${monthName} ${dayNum}.`
    }
    return `${count} contribution${count > 1 ? 's' : ''} on ${dayName}, ${monthName} ${dayNum}.`
  }

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
              <div>{stats.totalSubmissions} submissions in the last year</div>
            </div>

            {/* GitHub-style contribution heatmap */}
            <div className="github-heatmap-wrapper">
              <div
                className="github-heatmap"
                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                {/* Month headers - positioned with absolute positioning for accurate alignment */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginLeft: '40px',
                    position: 'relative',
                    height: '20px',
                  }}
                >
                  {calculateMonthPositions().map(month => (
                    <div
                      key={`month-${month.name}`}
                      style={{
                        position: 'absolute',
                        left: `${month.position}px`,
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#666',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {month.name}
                    </div>
                  ))}
                </div>

                {/* Day labels + Contribution grid */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Day labels (Mon, Tue, Wed, Thu, Fri, Sat, Sun) */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      width: '35px',
                      flexShrink: 0,
                    }}
                  >
                    {[
                      { name: 'Mon', index: 0 },
                      { name: '', index: 1 },
                      { name: 'Wed', index: 2 },
                      { name: '', index: 3 },
                      { name: 'Fri', index: 4 },
                      { name: '', index: 5 },
                      { name: 'Sun', index: 6 },
                    ].map(day => (
                      <div
                        key={`day-label-${day.index}`}
                        style={{
                          height: '14px',
                          fontSize: '11px',
                          fontWeight: '500',
                          color: '#666',
                          display: 'flex',
                          alignItems: 'center',
                          paddingRight: '4px',
                          textAlign: 'right',
                          lineHeight: '1',
                        }}
                      >
                        {day.name}
                      </div>
                    ))}
                  </div>

                  {/* Contribution grid - dynamic size up to today */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    {/* Generate 7 rows for 7 days of week (Mon-Sun) */}
                    {Array.from({ length: 7 }).map((_, dayOfWeekIdx) => {
                      const { startDate, weeksNeeded } =
                        calculateGridDimensions()
                      const today = new Date()

                      return (
                        <div
                          key={`row-${dayOfWeekIdx}`}
                          style={{ display: 'flex', gap: '2px' }}
                        >
                          {/* Generate weeks up to today */}
                          {Array.from({ length: weeksNeeded }).map(
                            (_, weekIdx) => {
                              // Calculate the date starting from Monday 365 days ago
                              const cellDate = new Date(startDate)
                              cellDate.setDate(
                                cellDate.getDate() + weekIdx * 7 + dayOfWeekIdx
                              )

                              // Check if this date is after today - if so, show empty
                              const isAfterToday = cellDate > today

                              // Get contribution count from actual data
                              const dateKey = cellDate
                                .toISOString()
                                .split('T')[0]
                              const contributionCount = !isAfterToday
                                ? contributionData.get(dateKey) || 0
                                : 0

                              const tooltipText = !isAfterToday
                                ? formatContributionTooltip(
                                    cellDate,
                                    contributionCount
                                  )
                                : ''

                              return (
                                <div
                                  key={`cell-${weekIdx}-${dayOfWeekIdx}`}
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                    backgroundColor: isAfterToday
                                      ? 'transparent'
                                      : getContributionColor(contributionCount),
                                    borderRadius: '2px',
                                    flexShrink: 0,
                                    cursor: !isAfterToday
                                      ? 'pointer'
                                      : 'default',
                                    border: isAfterToday
                                      ? '1px solid rgba(255,255,255,0.1)'
                                      : 'none',
                                  }}
                                  title={tooltipText}
                                />
                              )
                            }
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="contribution-legend">
                <span className="legend-text">Less</span>
                <div className="legend-items">
                  <div
                    className="legend-box"
                    title="No contributions"
                    style={{ backgroundColor: '#161b22' }}
                  />
                  <div
                    className="legend-box"
                    title="1-2 contributions"
                    style={{ backgroundColor: '#0e4429' }}
                  />
                  <div
                    className="legend-box"
                    title="3-4 contributions"
                    style={{ backgroundColor: '#006d32' }}
                  />
                  <div
                    className="legend-box"
                    title="5-7 contributions"
                    style={{ backgroundColor: '#26a641' }}
                  />
                  <div
                    className="legend-box"
                    title="8+ contributions"
                    style={{ backgroundColor: '#39d353' }}
                  />
                </div>
                <span className="legend-text">More</span>
              </div>
            </div>
          </div>

          <div className="recent-panel card">
            <div className="tabs">
              <button className="tab active">Recent AC</button>
              <a className="view-all" href="/dashboard/submissions">
                View all submissions ›
              </a>
            </div>
            {submissionsLoading ? (
              <div className="empty-state">
                <div className="empty-note">Loading submissions...</div>
              </div>
            ) : recentSubmissions.length > 0 ? (
              <div className="submissions-list">
                {recentSubmissions.map(submission => (
                  <div
                    key={submission.submissionId}
                    className="submission-item"
                  >
                    <div className="submission-header">
                      <span className="problem-title">
                        {submission.problemTitle || 'Problem'}
                      </span>
                      <span className="submission-badge accepted">
                        ✓ Accepted
                      </span>
                    </div>
                    <div className="submission-details">
                      <span className="language-tag">
                        {submission.language}
                      </span>
                      <span className="submission-time">
                        {submission.submittedAt
                          ? new Date(
                              submission.submittedAt
                            ).toLocaleDateString()
                          : 'N/A'}
                      </span>
                      {submission.executionTime && (
                        <span className="execution-time">
                          {submission.executionTime}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
            )}
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
