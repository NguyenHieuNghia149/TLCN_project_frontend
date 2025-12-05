import React, { useState } from 'react'
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi'
import { MdEmojiEvents } from 'react-icons/md'
import { useLeaderboard } from '../../hooks/api/useLeaderboard'
import { useAuth } from '../../hooks/api/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './ranking.css'

const Ranking: React.FC = () => {
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  const { ranking, loading, error, pagination } = useLeaderboard({
    page,
    limit,
  })

  const { user: currentUser } = useAuth()

  const getRankIcon = (rank: number) => {
    const rankNum = typeof rank === 'string' ? parseInt(rank, 10) : rank
    if (rankNum === 1) return <MdEmojiEvents className="rank-icon gold" />
    if (rankNum === 2) return <MdEmojiEvents className="rank-icon silver" />
    if (rankNum === 3) return <MdEmojiEvents className="rank-icon bronze" />
    return <span className="rank-number">{rank}</span>
  }

  const getRankBadgeClass = (rank: number) => {
    const rankNum = typeof rank === 'string' ? parseInt(rank, 10) : rank
    if (rankNum === 1) return 'rank-badge gold'
    if (rankNum === 2) return 'rank-badge silver'
    if (rankNum === 3) return 'rank-badge bronze'
    return 'rank-badge'
  }

  const getTrendIcon = (currentRank: number, previousRank?: number) => {
    if (!previousRank) return <FiMinus className="trend-icon neutral" />
    if (currentRank < previousRank)
      return <FiTrendingUp className="trend-icon up" />
    if (currentRank > previousRank)
      return <FiTrendingDown className="trend-icon down" />
    return <FiMinus className="trend-icon neutral" />
  }

  if (loading) {
    return (
      <div className="ranking-page">
        <div className="ranking-container">
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ranking-page">
        <div className="ranking-container">
          <div className="py-8 text-center">
            <h2 className="mb-2 text-xl font-semibold text-red-600">
              Error Loading Ranking
            </h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ranking-page">
      <div className="ranking-container">
        <div className="ranking-header">
          <h1 className="ranking-title">Leaderboard</h1>
          <p className="ranking-subtitle">
            Compete with the best and climb the rankings
          </p>
        </div>

        <div className="ranking-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <MdEmojiEvents className="text-yellow-500" />
            </div>
            <div className="stat-info">
              <div className="stat-value">{pagination.total || 0}</div>
              <div className="stat-label">Total Participants</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiTrendingUp className="text-green-500" />
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {ranking.length > 0 ? ranking[0].rankingPoint || 0 : 0}
              </div>
              <div className="stat-label">Top Points</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiTrendingUp className="text-blue-500" />
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {ranking.length > 0 ? ranking[0].totalSubmissions : 0}
              </div>
              <div className="stat-label">Top Submissions</div>
            </div>
          </div>
        </div>

        <div className="ranking-table-container">
          <div className="ranking-table-header">
            <div className="header-cell rank-cell">Rank</div>
            <div className="header-cell user-cell">User</div>
            <div className="header-cell stat-header">Points</div>
            <div className="header-cell stat-header">Submissions</div>
            <div className="header-cell trend-cell">Trend</div>
          </div>{' '}
          <div className="ranking-table-body">
            {ranking.length === 0 ? (
              <div className="empty-state">
                <p>No rankings available yet.</p>
              </div>
            ) : (
              ranking.map((user, index) => (
                <div
                  key={user.id}
                  className={`ranking-row ${index < 3 ? 'top-three' : ''} ${currentUser?.id === user.id ? 'current-user' : ''}`}
                >
                  <div
                    className={`cell rank-cell ${getRankBadgeClass(user.rank)}`}
                  >
                    {getRankIcon(user.rank)}
                  </div>
                  <div className="cell user-cell">
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </div>
                        )}
                      </div>
                      <div className="user-details">
                        <div className="user-name">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="cell stat-cell">{user.rankingPoint || 0}</div>
                  <div className="cell stat-cell">{user.totalSubmissions}</div>
                  <div className="cell trend-cell">
                    {getTrendIcon(user.rank)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="ranking-pagination">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="pagination-btn"
          >
            Previous
          </button>

          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={!pagination.hasNextPage}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default Ranking
