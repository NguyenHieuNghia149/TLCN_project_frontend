import React, { useState, useEffect, useRef } from 'react'
import { useProfile } from '../../hooks/api/useProfile'
import { UpdateProfileData } from '../../services/api/profile.service'
import '../../pages/profile/Profile.css'
import { API_CONFIG } from '../../config/api.config'
import { submissionsService } from '../../services/api/submissions.service'
import type { SubmissionDetail } from '../../types/submission.types'
import AvatarCropper from '../../components/common/AvatarCropper'

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
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  )
  const [allSubmissions, setAllSubmissions] = useState<SubmissionDetail[]>([])
  const [showCropper, setShowCropper] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [croppedAvatarBlob, setCroppedAvatarBlob] = useState<Blob | null>(null)
  const [croppedAvatarPreview, setCroppedAvatarPreview] = useState<
    string | null
  >(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const firstName = profile?.firstName || 'User'
  const lastName = profile?.lastName || ''
  const fullName = profile ? `${firstName} ${lastName}`.trim() : 'User'

  useEffect(() => {
    if (profile?.id) {
      loadRecentSubmissions()
      loadContributionData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const loadContributionData = async () => {
    try {
      const allSubmissionsList: SubmissionDetail[] = []
      let offset = 0
      const limit = 100
      let hasMore = true

      while (hasMore) {
        const response = await submissionsService.getUserSubmissions({
          limit,
          offset,
        })

        allSubmissionsList.push(...response.submissions)

        hasMore =
          response.submissions.length === limit &&
          allSubmissionsList.length < response.total

        offset += limit
      }

      setAllSubmissions(allSubmissionsList)
      updateContributionDataForYear(allSubmissionsList, selectedYear)
    } catch (err) {
      console.error('Failed to load contribution data:', err)
    }
  }

  const updateContributionDataForYear = (
    submissions: SubmissionDetail[],
    year: number
  ) => {
    const contributionsMap = new Map<string, number>()

    submissions.forEach(submission => {
      if (submission.submittedAt) {
        const date = new Date(submission.submittedAt)
        const submissionYear = date.getFullYear()

        if (submissionYear === year) {
          const dateKey = date.toISOString().split('T')[0]
          contributionsMap.set(
            dateKey,
            (contributionsMap.get(dateKey) || 0) + 1
          )
        }
      }
    })

    setContributionData(contributionsMap)
  }

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    if (allSubmissions.length > 0) {
      updateContributionDataForYear(allSubmissions, year)
    }
  }

  const getAvailableYears = (): number[] => {
    const years = new Set<number>()
    const currentYear = new Date().getFullYear()

    years.add(currentYear)

    if (allSubmissions.length > 0) {
      allSubmissions.forEach(submission => {
        if (submission.submittedAt) {
          const year = new Date(submission.submittedAt).getFullYear()
          years.add(year)
        }
      })

      const submissionYears = Array.from(years).filter(y => y <= currentYear)
      if (submissionYears.length > 0) {
        const firstYear = Math.min(...submissionYears)
        for (let y = firstYear; y <= currentYear; y++) {
          years.add(y)
        }
      }
    }

    return Array.from(years).sort((a, b) => b - a)
  }

  const calculateMonthPositions = () => {
    const yearStart = new Date(selectedYear, 0, 1)
    const yearEnd = new Date(selectedYear, 11, 31)
    const endDate = yearEnd

    const startDate = new Date(yearStart)
    const dayOfWeek = startDate.getDay()
    if (dayOfWeek !== 0) {
      startDate.setDate(startDate.getDate() - dayOfWeek)
    }

    const monthStarts: Array<{
      name: string
      weekIndex: number
      position: number
    }> = []
    const months = [
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

    const cellWidth = 14
    const cellGap = 3
    const weekWidth = cellWidth + cellGap

    for (let i = 0; i < months.length; i++) {
      const monthDate = new Date(selectedYear, i, 1)

      if (monthDate < startDate || monthDate > endDate) {
        continue
      }

      const diffTime = monthDate.getTime() - startDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const weekIndex = Math.floor(diffDays / 7)
      const position = weekIndex * weekWidth

      monthStarts.push({
        name: months[i],
        weekIndex: Math.max(0, weekIndex),
        position: Math.max(0, position),
      })
    }

    const filteredMonths: Array<{
      name: string
      weekIndex: number
      position: number
    }> = []

    monthStarts.forEach((month, index) => {
      if (index === 0) {
        filteredMonths.push(month)
      } else {
        const prevMonth = filteredMonths[filteredMonths.length - 1]
        if (month.position - prevMonth.position >= weekWidth * 4) {
          filteredMonths.push(month)
        }
      }
    })

    return filteredMonths
  }

  const calculateGridDimensions = () => {
    const yearStart = new Date(selectedYear, 0, 1)
    const yearEnd = new Date(selectedYear, 11, 31)
    const endDate = yearEnd

    const startDate = new Date(yearStart)
    const dayOfWeek = startDate.getDay()
    if (dayOfWeek !== 0) {
      startDate.setDate(startDate.getDate() - dayOfWeek)
    }

    const diffTime = endDate.getTime() - startDate.getTime()
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    const weeksNeeded = Math.ceil(totalDays / 7)

    return { startDate, totalDays, weeksNeeded, endDate, yearStart }
  }

  const getContributionLevel = (count: number): number => {
    if (count === 0) return 0
    if (count <= 1) return 1
    if (count <= 2) return 2
    if (count <= 4) return 3
    return 4
  }

  const formatContributionTooltip = (date: Date, count: number): string => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const monthName = date.toLocaleDateString('en-US', { month: 'short' })
    const dayNum = date.getDate()

    if (count === 0) {
      return `No contributions on ${dayName}, ${monthName} ${dayNum}.`
    }
    return `${count} contribution${count > 1 ? 's' : ''} on ${dayName}, ${monthName} ${dayNum}.`
  }

  const getAvatarUrl = () => {
    if (profile?.avatar) return profile.avatar
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
    if (croppedAvatarPreview) {
      URL.revokeObjectURL(croppedAvatarPreview)
    }
    setCroppedAvatarBlob(null)
    setCroppedAvatarPreview(null)
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUpdateError('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUpdateError('File size must not exceed 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
      setShowCropper(true)
    }
    reader.onerror = () => {
      setUpdateError('Cannot read image file')
    }
    reader.readAsDataURL(file)
  }

  const handleCroppedAvatar = (croppedImageBlob: Blob) => {
    setShowCropper(false)
    setCroppedAvatarBlob(croppedImageBlob)

    const previewUrl = URL.createObjectURL(croppedImageBlob)
    setCroppedAvatarPreview(previewUrl)

    setAvatarPreview(null)
    if (avatarInputRef.current) {
      avatarInputRef.current.value = ''
    }
  }

  const uploadAvatar = async (file: File): Promise<string> => {
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const uploadUrl = `${API_CONFIG.baseURL}/auth/profile/upload-avatar`

      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })

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

      const firstName = (formData.get('firstName') as string)?.trim()
      const lastName = (formData.get('lastName') as string)?.trim()
      const gender = (formData.get('gender') as string)?.trim()
      const dateOfBirthValue = (formData.get('dateOfBirth') as string)?.trim()

      if (firstName) {
        updateData.firstName = firstName
      }
      if (lastName) {
        updateData.lastName = lastName
      }

      if (croppedAvatarBlob) {
        try {
          const croppedFile = new File([croppedAvatarBlob], 'avatar.jpg', {
            type: 'image/jpeg',
          })
          const avatarUrl = await uploadAvatar(croppedFile)
          updateData.avatar = avatarUrl
        } catch (avatarError) {
          setUpdateError(
            avatarError instanceof Error
              ? avatarError.message
              : 'Failed to upload avatar'
          )
          setIsUpdating(false)
          return
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

      if (croppedAvatarPreview) {
        URL.revokeObjectURL(croppedAvatarPreview)
      }
      setCroppedAvatarBlob(null)
      setCroppedAvatarPreview(null)

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

        <div className="profile-main">
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

          <div className="heatmap card">
            <div className="heatmap-header">
              <div>
                {(() => {
                  const yearCount = Array.from(
                    contributionData.values()
                  ).reduce((sum, count) => sum + count, 0)
                  return `${yearCount} submission${yearCount !== 1 ? 's' : ''} in ${selectedYear}`
                })()}
              </div>
              <div className="year-selector">
                <select
                  value={selectedYear}
                  onChange={e => handleYearChange(Number(e.target.value))}
                  className="year-select"
                >
                  {getAvailableYears().map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="github-heatmap-wrapper">
              <div
                className="github-heatmap"
                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginLeft: '43px',
                    position: 'relative',
                    height: '20px',
                    width: 'calc(100% - 43px)',
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
                        color: 'var(--muted-foreground)',
                        whiteSpace: 'nowrap',
                        transform: 'translateX(0)',
                      }}
                    >
                      {month.name}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      width: '35px',
                      flexShrink: 0,
                    }}
                  >
                    {[
                      { name: 'Sun', index: 0 },
                      { name: '', index: 1 },
                      { name: 'Tue', index: 2 },
                      { name: '', index: 3 },
                      { name: 'Thu', index: 4 },
                      { name: '', index: 5 },
                      { name: 'Sat', index: 6 },
                    ].map(day => (
                      <div
                        key={`day-label-${day.index}`}
                        style={{
                          height: '14px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: 'var(--muted-foreground)',
                          display: 'flex',
                          alignItems: 'center',
                          paddingRight: '4px',
                          textAlign: 'right',
                          lineHeight: '14px',
                        }}
                      >
                        {day.name}
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                    }}
                  >
                    {Array.from({ length: 7 }).map((_, dayOfWeekIdx) => {
                      const { startDate, weeksNeeded, endDate, yearStart } =
                        calculateGridDimensions()

                      return (
                        <div
                          key={`row-${dayOfWeekIdx}`}
                          style={{ display: 'flex', gap: '3px' }}
                        >
                          {Array.from({ length: weeksNeeded }).map(
                            (_, weekIdx) => {
                              const cellDate = new Date(startDate)
                              cellDate.setDate(
                                cellDate.getDate() + weekIdx * 7 + dayOfWeekIdx
                              )

                              const isBeforeYear = cellDate < yearStart
                              const isAfterEnd = cellDate > endDate
                              const today = new Date()
                              const isAfterToday =
                                selectedYear === today.getFullYear() &&
                                cellDate > today

                              const dateKey = cellDate
                                .toISOString()
                                .split('T')[0]
                              const contributionCount =
                                !isBeforeYear && !isAfterEnd && !isAfterToday
                                  ? contributionData.get(dateKey) || 0
                                  : 0

                              const tooltipText =
                                !isBeforeYear && !isAfterEnd
                                  ? formatContributionTooltip(
                                      cellDate,
                                      contributionCount
                                    )
                                  : ''

                              return isBeforeYear || isAfterEnd ? (
                                <div
                                  key={`cell-${weekIdx}-${dayOfWeekIdx}`}
                                  className="contribution-cell--empty"
                                />
                              ) : (
                                <div
                                  key={`cell-${weekIdx}-${dayOfWeekIdx}`}
                                  className="contribution-cell"
                                  data-level={getContributionLevel(
                                    contributionCount
                                  )}
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

              <div className="contribution-legend">
                <span className="legend-text">Less</span>
                <div className="legend-items">
                  <div
                    className="legend-box"
                    data-level="0"
                    title="No contributions"
                  />
                  <div
                    className="legend-box"
                    data-level="1"
                    title="1 contribution"
                  />
                  <div
                    className="legend-box"
                    data-level="2"
                    title="2 contributions"
                  />
                  <div
                    className="legend-box"
                    data-level="3"
                    title="3-4 contributions"
                  />
                  <div
                    className="legend-box"
                    data-level="4"
                    title="5+ contributions"
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
                View all submissions â€º
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
                        âœ“ Accepted
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
                    : `âœ“ ${stats.acceptedSubmissions} Accepted`}
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

      {showEditModal && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Edit Profile</h3>
            {updateError && (
              <div
                className="error-message"
                style={{ color: 'var(--destructive)', marginBottom: '1rem' }}
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
                {croppedAvatarPreview && (
                  <div style={{ marginBottom: '12px' }}>
                    <img
                      src={croppedAvatarPreview}
                      alt="Cropped avatar preview"
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '1px solid rgb(var(--border))',
                        marginBottom: '8px',
                        display: 'block',
                      }}
                    />
                  </div>
                )}
                <input
                  ref={avatarInputRef}
                  name="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                />
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

      {showCropper && avatarPreview && (
        <AvatarCropper
          imageSrc={avatarPreview}
          onCropComplete={handleCroppedAvatar}
          onCancel={() => {
            setShowCropper(false)
            setAvatarPreview(null)
            if (avatarInputRef.current) {
              avatarInputRef.current.value = ''
            }
          }}
        />
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
