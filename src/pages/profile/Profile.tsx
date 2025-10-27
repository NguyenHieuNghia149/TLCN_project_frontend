import React from 'react'
import { useProfile } from '../../hooks/api/useProfile'
import '../../pages/profile/Profile.css'

const Profile: React.FC = () => {
  const { profile, loading, error } = useProfile()

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
          <button className="edit-btn">Edit Profile</button>

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
