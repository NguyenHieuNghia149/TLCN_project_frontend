import React, { useState } from 'react'
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi'
import { MdEmojiEvents } from 'react-icons/md'
import { useRanking } from '../../hooks/api/useRanking'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import './ranking.css'

const Ranking: React.FC = () => {
  const [sortBy, setSortBy] = useState<
    'acceptedProblems' | 'successRate' | 'totalSubmissions'
  >('acceptedProblems')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const { ranking, loading, error } = useRanking({
    sortBy,
    sortOrder,
    limit: 100,
  })

  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(newSortBy)
      setSortOrder('desc')
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <MdEmojiEvents className="rank-icon gold" />
    if (rank === 2) return <MdEmojiEvents className="rank-icon silver" />
    if (rank === 3) return <MdEmojiEvents className="rank-icon bronze" />
    return <span className="rank-number">{rank}</span>
  }

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return 'rank-badge gold'
    if (rank === 2) return 'rank-badge silver'
    if (rank === 3) return 'rank-badge bronze'
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
              <div className="stat-value">{ranking.length}</div>
              <div className="stat-label">Total Participants</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiTrendingUp className="text-green-500" />
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {ranking.length > 0 ? ranking[0].acceptedProblems : 0}
              </div>
              <div className="stat-label">Top Solved Problems</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiTrendingUp className="text-blue-500" />
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {ranking.length > 0
                  ? `${ranking[0].successRate.toFixed(1)}%`
                  : '0%'}
              </div>
              <div className="stat-label">Best Success Rate</div>
            </div>
          </div>
        </div>

        <div className="ranking-table-container">
          <div className="ranking-table-header">
            <div className="header-cell rank-cell">Rank</div>
            <div className="header-cell user-cell">User</div>
            <div
              className={`header-cell sortable-cell ${sortBy === 'acceptedProblems' ? 'active' : ''}`}
              onClick={() => handleSort('acceptedProblems')}
            >
              Solved
              <span className="sort-icon">
                {sortBy === 'acceptedProblems' && sortOrder === 'desc'
                  ? '↓'
                  : '↑'}
              </span>
            </div>
            <div
              className={`header-cell sortable-cell ${sortBy === 'totalSubmissions' ? 'active' : ''}`}
              onClick={() => handleSort('totalSubmissions')}
            >
              Submissions
              <span className="sort-icon">
                {sortBy === 'totalSubmissions' && sortOrder === 'desc'
                  ? '↓'
                  : '↑'}
              </span>
            </div>
            <div
              className={`header-cell sortable-cell ${sortBy === 'successRate' ? 'active' : ''}`}
              onClick={() => handleSort('successRate')}
            >
              Success Rate
              <span className="sort-icon">
                {sortBy === 'successRate' && sortOrder === 'desc' ? '↓' : '↑'}
              </span>
            </div>
            <div className="header-cell trend-cell">Trend</div>
          </div>

          <div className="ranking-table-body">
            {ranking.length === 0 ? (
              <div className="empty-state">
                <p>No rankings available yet.</p>
              </div>
            ) : (
              ranking.map((user, index) => (
                <div
                  key={user.id}
                  className={`ranking-row ${index < 3 ? 'top-three' : ''}`}
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
                  <div className="cell stat-cell">{user.acceptedProblems}</div>
                  <div className="cell stat-cell">{user.totalSubmissions}</div>
                  <div className="cell stat-cell">
                    <div className="success-rate">
                      <span className="rate-value">
                        {user.successRate.toFixed(1)}%
                      </span>
                      <div className="rate-bar">
                        <div
                          className="rate-fill"
                          style={{ width: `${user.successRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="cell trend-cell">
                    {getTrendIcon(user.rank)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ranking
