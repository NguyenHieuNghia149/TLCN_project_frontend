import React from 'react'
import { MdEmojiEvents } from 'react-icons/md'
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi'
import { useRanking } from '@/hooks/api/useRanking'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import './UserRankCard.css'

const UserRankCard: React.FC = () => {
  const { userRank, loading } = useRanking()

  if (loading) {
    return (
      <div className="user-rank-card">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!userRank) {
    return (
      <div className="user-rank-card">
        <div className="user-rank-empty">
          <p>Sign in to see your ranking</p>
        </div>
      </div>
    )
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <MdEmojiEvents className="rank-icon-lg gold" />
    if (rank === 2) return <MdEmojiEvents className="rank-icon-lg silver" />
    if (rank === 3) return <MdEmojiEvents className="rank-icon-lg bronze" />
    return <span className="rank-number-lg">{rank}</span>
  }

  const getTrendIcon = () => {
    // Calculate trend based on percentile
    // If percentile > 70, it's trending up (top 30%)
    // If percentile < 30, it's trending down (bottom 30%)
    const percentile = userRank.percentile || 0
    if (percentile >= 70) {
      return <FiTrendingUp className="trend-icon-lg up" />
    } else if (percentile <= 30) {
      return <FiTrendingDown className="trend-icon-lg down" />
    } else {
      return <FiMinus className="trend-icon-lg neutral" />
    }
  }

  return (
    <div className="user-rank-card">
      <div className="user-rank-header">
        <h2>Your Ranking</h2>
      </div>
      <div className="user-rank-content">
        <div className="user-rank-main">
          <div className="user-rank-badge">{getRankIcon(userRank.rank)}</div>
          <div className="user-rank-details">
            <div className="user-rank-name">
              {userRank.firstName} {userRank.lastName}
            </div>
            <div className="user-rank-position">
              Rank <span className="rank-number">#{userRank.rank}</span>
            </div>
          </div>
        </div>

        <div className="user-rank-stats">
          <div className="stat-item">
            <div className="stat-label">Points</div>
            <div className="stat-value">{userRank.rankingPoint || 0}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Submissions</div>
            <div className="stat-value">{userRank.totalSubmissions || 0}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Trend</div>
            <div className="stat-value trend-display">{getTrendIcon()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserRankCard
