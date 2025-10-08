import React from 'react'
import '../../pages/profile/Profile.css'

type UserProfile = {
  id: string
  fullName: string
  username: string
  email: string
  bio?: string
  avatarUrl?: string
  location?: string
  website?: string
  stats?: {
    solved: number
    easy: number
    medium: number
    hard: number
    reputation: number
    streak: number
  }
}

const mockUser: UserProfile = {
  id: 'user-1',
  fullName: 'r4UAz1aB79',
  username: 'r4UAz1aB79',
  email: 'you@example.com',
  bio: undefined,
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
  location: 'United States',
  website: undefined,
  stats: {
    solved: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    reputation: 0,
    streak: 0,
  },
}

const Profile: React.FC = () => {
  const user = mockUser

  return (
    <div className="profile-page">
      <div className="profile-grid">
        {/* Left Sidebar */}
        <aside className="profile-sidebar card">
          <div className="profile-card__header">
            <div className="profile-avatar">
              <img src={user.avatarUrl} alt={user.fullName} />
            </div>
            <div className="profile-identity">
              <div className="profile-name">{user.fullName}</div>
              <div className="profile-rank">Rank ~5,000,000</div>
            </div>
            <button className="btn edit-btn">Edit Profile</button>
          </div>

          <Section title="Community Stats">
            <div className="kv">
              <Row label="Views" value={0} note="Last week 0" />
              <Row label="Solution" value={0} note="Last week 0" />
              <Row label="Discuss" value={0} note="Last week 0" />
              <Row label="Reputation" value={0} note="Last week 0" />
            </div>
          </Section>

          <Section title="Languages">
            <div className="muted">Not enough data</div>
          </Section>

          <Section title="Skills">
            <div className="skills-list">
              <Skill label="Advanced" />
              <Skill label="Intermediate" />
              <Skill label="Fundamental" />
            </div>
          </Section>
        </aside>

        {/* Main Content */}
        <div className="profile-main">
          {/* Top summary cards */}
          <div className="summary-row">
            <div className="summary-card card">
              <div className="summary-header">
                <div className="circle-meter">0</div>
                <div className="legend">
                  <div className="legend-row easy">
                    Easy <span>{user.stats?.easy ?? 0}/901</span>
                  </div>
                  <div className="legend-row medium">
                    Med. <span>{user.stats?.medium ?? 0}/1920</span>
                  </div>
                  <div className="legend-row hard">
                    Hard <span>{user.stats?.hard ?? 0}/870</span>
                  </div>
                </div>
              </div>
              <div className="attempting">0 Attempting</div>
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
              <div>0 submissions in the past one year</div>
              <div className="muted">Total active days: 0 · Max streak: 0</div>
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
              <div className="empty-illus">Null</div>
              <div className="empty-note">No recent submissions</div>
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

const Skill: React.FC<{ label: string }> = ({ label }) => (
  <div className="skill">
    <span className="dot" />
    <span>{label}</span>
    <span className="muted">Not enough data</span>
  </div>
)

export default Profile
