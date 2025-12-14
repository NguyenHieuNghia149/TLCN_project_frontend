import React, { useState, useEffect } from 'react'
import {
  Users,
  Code2,
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  FileText,
  Loader,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import './AdminHome.scss'
import dashboardService from '@/services/api/dashboard.service'
import { DashboardStats } from '@/services/api/dashboard.service'
import ChartTooltip from './ChartTooltip'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: string
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'blue',
}) => {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-card__header">
        <div
          className={`admin-stat-card__icon admin-stat-card__icon--${color}`}
        >
          {icon}
        </div>
        <div className="admin-stat-card__content">
          <h3 className="admin-stat-card__title">{title}</h3>
          <p className="admin-stat-card__value">{value}</p>
          {trend && (
            <div
              className={`admin-stat-card__trend ${
                trend.isPositive
                  ? 'admin-stat-card__trend--positive'
                  : 'admin-stat-card__trend--negative'
              }`}
            >
              <TrendingUp size={14} />
              <span>{Math.abs(trend.value)}% from last month</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const AdminHome: React.FC = () => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const response = await dashboardService.getStats()
      setDashboardStats(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-home">
        <div className="admin-home__container">
          <div className="admin-home__loading">
            <Loader className="admin-home__loading-icon" />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !dashboardStats) {
    return (
      <div className="admin-home">
        <div className="admin-home__container">
          <div className="admin-home__error">
            <AlertCircle size={32} />
            <p>{error || 'Failed to load dashboard'}</p>
            <button
              onClick={fetchDashboardStats}
              className="admin-home__retry-btn"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-home">
      <div className="admin-home__container">
        {/* Header */}
        <div className="admin-home__header">
          <div>
            <h1 className="admin-home__title">Admin Dashboard</h1>
            <p className="admin-home__subtitle">
              Welcome back! Here's what's happening with your platform today.
            </p>
          </div>
          <button className="admin-home__settings-btn">
            <Settings size={20} />
            Settings
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="admin-home__stats">
          <StatCard
            title="Total Users"
            value={dashboardStats.totalUsers.toLocaleString()}
            icon={<Users size={24} />}
            trend={{ value: 12, isPositive: true }}
            color="blue"
          />
          <StatCard
            title="Active Challenges"
            value={dashboardStats.totalChallenges}
            icon={<Code2 size={24} />}
            trend={{ value: 8, isPositive: true }}
            color="green"
          />
          <StatCard
            title="Lessons Published"
            value={dashboardStats.totalLessons}
            icon={<BookOpen size={24} />}
            trend={{ value: 3, isPositive: true }}
            color="purple"
          />
          <StatCard
            title="Total Submissions"
            value={dashboardStats.totalSubmissions}
            icon={<TrendingUp size={24} />}
            trend={{ value: 15, isPositive: true }}
            color="orange"
          />
          <StatCard
            title="Active Users"
            value={dashboardStats.activeUsers}
            icon={<Code2 size={24} />}
            color="green"
          />
          <StatCard
            title="Total Exams"
            value={dashboardStats.totalExams}
            icon={<FileText size={24} />}
            color="blue"
          />
        </div>

        {/* Charts Section */}
        <div className="admin-home__charts">
          {/* User Growth Chart */}
          <div className="admin-home__chart-container">
            <h3 className="admin-home__chart-title">
              User Growth (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardStats.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  name="Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Submission Trend Chart */}
          <div className="admin-home__chart-container">
            <h3 className="admin-home__chart-title">
              Submissions Trend (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardStats.submissionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="count" fill="#10b981" name="Submissions" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Topic Distribution Chart */}
          <div className="admin-home__chart-container">
            <h3 className="admin-home__chart-title">Topic Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardStats.topicDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  interval={0}
                  tick={{ fontSize: 12 }}
                  height={60}
                />
                <YAxis />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="lessons" fill="#3b82f6" name="Lessons" />
                <Bar dataKey="problems" fill="#10b981" name="Problems" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Lesson Stats Chart */}
          <div className="admin-home__chart-container">
            <h3 className="admin-home__chart-title">Content Statistics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardStats.lessonStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="count" fill="#6366f1" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="admin-home__section">
          <div className="admin-home__section-header">
            <h2 className="admin-home__section-title">Recent Activity</h2>
          </div>

          <div className="admin-home__activity-grid">
            {/* Recent Users */}
            <div className="admin-home__activity-subsection">
              <h3 className="admin-home__activity-subtitle">
                New Registrations
              </h3>
              <div className="admin-home__activity-list">
                {dashboardStats.recentUsers.map(user => (
                  <div
                    key={user.id}
                    className="admin-activity-item admin-activity-item--user"
                  >
                    <div className="admin-activity-item__icon">
                      <CheckCircle size={16} />
                    </div>
                    <div className="admin-activity-item__content">
                      <h4 className="admin-activity-item__title">
                        New user registered
                      </h4>
                      <p className="admin-activity-item__description">
                        {user.firstName || ''} {user.lastName || ''} joined the
                        platform
                      </p>
                      <div className="admin-activity-item__time">
                        <Clock size={12} />
                        <span>
                          {new Date(user.createdAt).toLocaleString([], {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Lessons */}
            <div className="admin-home__activity-subsection">
              <h3 className="admin-home__activity-subtitle">New Lessons</h3>
              <div className="admin-home__activity-list">
                {dashboardStats.recentLessons.map(lesson => (
                  <div
                    key={lesson.id}
                    className="admin-activity-item admin-activity-item--lesson"
                  >
                    <div className="admin-activity-item__icon">
                      <BookOpen size={16} />
                    </div>
                    <div className="admin-activity-item__content">
                      <h4 className="admin-activity-item__title">
                        New lesson published
                      </h4>
                      <p className="admin-activity-item__description">
                        "{lesson.title || 'Untitled'}" is now live
                      </p>
                      <div className="admin-activity-item__time">
                        <Clock size={12} />
                        <span>
                          {new Date(lesson.createdAt).toLocaleString([], {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Problems */}
            <div className="admin-home__activity-subsection">
              <h3 className="admin-home__activity-subtitle">New Problems</h3>
              <div className="admin-home__activity-list">
                {dashboardStats.recentProblems.map(problem => (
                  <div
                    key={problem.id}
                    className="admin-activity-item admin-activity-item--lesson"
                  >
                    <div className="admin-activity-item__icon">
                      <Code2 size={16} />
                    </div>
                    <div className="admin-activity-item__content">
                      <h4 className="admin-activity-item__title">
                        New problem created
                      </h4>
                      <p className="admin-activity-item__description">
                        "{problem.title || 'Untitled'}" is ready for submissions
                      </p>
                      <div className="admin-activity-item__time">
                        <Clock size={12} />
                        <span>
                          {new Date(problem.createdAt).toLocaleString([], {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Exams */}
            <div className="admin-home__activity-subsection">
              <h3 className="admin-home__activity-subtitle">New Exams</h3>
              <div className="admin-home__activity-list">
                {dashboardStats.recentExams.map(examItem => (
                  <div
                    key={examItem.id}
                    className="admin-activity-item admin-activity-item--lesson"
                  >
                    <div className="admin-activity-item__icon">
                      <FileText size={16} />
                    </div>
                    <div className="admin-activity-item__content">
                      <h4 className="admin-activity-item__title">
                        New exam created
                      </h4>
                      <p className="admin-activity-item__description">
                        "{examItem.title || 'Untitled'}" is now available
                      </p>
                      <div className="admin-activity-item__time">
                        <Clock size={12} />
                        <span>
                          {new Date(examItem.createdAt).toLocaleString([], {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminHome
