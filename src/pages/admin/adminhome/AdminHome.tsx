import React, { useState } from 'react'
import {
  Users,
  Code2,
  BookOpen,
  TrendingUp,
  Activity,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  ArrowRight,
  Settings,
  FileText,
  MessageSquare,
} from 'lucide-react'
import './AdminHome.scss'
import { useNavigate } from 'react-router-dom'

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

interface QuickActionProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick?: () => void
  color?: string
}

const QuickAction: React.FC<QuickActionProps> = ({
  title,
  description,
  icon,
  onClick,
  color = 'blue',
}) => {
  return (
    <div
      className={`admin-quick-action admin-quick-action--${color}`}
      onClick={onClick}
    >
      <div className="admin-quick-action__icon">{icon}</div>
      <div className="admin-quick-action__content">
        <h4 className="admin-quick-action__title">{title}</h4>
        <p className="admin-quick-action__description">{description}</p>
      </div>
      <ArrowRight className="admin-quick-action__arrow" size={20} />
    </div>
  )
}

const AdminHome: React.FC = () => {
  const navigate = useNavigate()
  const [recentActivities] = useState([
    {
      id: 1,
      type: 'success',
      title: 'New user registered',
      description: 'john.doe@example.com joined the platform',
      time: '2 minutes ago',
      icon: <CheckCircle size={16} />,
    },
    {
      id: 2,
      type: 'warning',
      title: 'Challenge submission pending review',
      description: '5 new submissions need review',
      time: '15 minutes ago',
      icon: <AlertCircle size={16} />,
    },
    {
      id: 3,
      type: 'info',
      title: 'New lesson published',
      description: 'Data Structures lesson is now live',
      time: '1 hour ago',
      icon: <BookOpen size={16} />,
    },
    {
      id: 4,
      type: 'success',
      title: 'System backup completed',
      description: 'Daily backup finished successfully',
      time: '2 hours ago',
      icon: <CheckCircle size={16} />,
    },
  ])

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
            value="12,543"
            icon={<Users size={24} />}
            trend={{ value: 12, isPositive: true }}
            color="blue"
          />
          <StatCard
            title="Active Challenges"
            value="247"
            icon={<Code2 size={24} />}
            trend={{ value: 8, isPositive: true }}
            color="green"
          />
          <StatCard
            title="Lessons Published"
            value="89"
            icon={<BookOpen size={24} />}
            trend={{ value: 3, isPositive: true }}
            color="purple"
          />
          <StatCard
            title="Platform Growth"
            value="+24%"
            icon={<TrendingUp size={24} />}
            trend={{ value: 15, isPositive: true }}
            color="orange"
          />
        </div>

        {/* Main Content Grid */}
        <div className="admin-home__grid">
          {/* Quick Actions */}
          <div className="admin-home__section">
            <div className="admin-home__section-header">
              <h2 className="admin-home__section-title">Quick Actions</h2>
            </div>
            <div className="admin-home__quick-actions">
              <QuickAction
                title="Manage Users"
                description="View and manage user accounts"
                icon={<Users size={20} />}
                onClick={() => navigate('/admin/users')}
                color="blue"
              />
              <QuickAction
                title="Manage Teachers"
                description="View and manage teacher accounts"
                icon={<Users size={20} />}
                onClick={() => navigate('/admin/teachers')}
                color="green"
              />
              <QuickAction
                title="Create Challenge"
                description="Add a new coding challenge"
                icon={<Code2 size={20} />}
                onClick={() => navigate('/admin/challenges/new')}
                color="green"
              />
              <QuickAction
                title="Manage Lessons"
                description="Create and edit lessons"
                icon={<BookOpen size={20} />}
                onClick={() => navigate('/admin/lessons')}
                color="purple"
              />
              <QuickAction
                title="Manage Topics"
                description="Create and manage topics"
                icon={<FileText size={20} />}
                onClick={() => navigate('/admin/topics')}
                color="purple"
              />
              <QuickAction
                title="View Reports"
                description="Access platform analytics"
                icon={<BarChart3 size={20} />}
                onClick={() => navigate('/admin/reports')}
                color="orange"
              />
              <QuickAction
                title="System Settings"
                description="Configure platform settings"
                icon={<Settings size={20} />}
                onClick={() => navigate('/admin/settings')}
                color="gray"
              />
              <QuickAction
                title="Moderation"
                description="Review and moderate content"
                icon={<Shield size={20} />}
                onClick={() => navigate('/admin/moderation')}
                color="red"
              />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="admin-home__section">
            <div className="admin-home__section-header">
              <h2 className="admin-home__section-title">Recent Activity</h2>
              <button className="admin-home__view-all-btn">View All</button>
            </div>
            <div className="admin-home__activity-list">
              {recentActivities.map(activity => (
                <div
                  key={activity.id}
                  className={`admin-activity-item admin-activity-item--${activity.type}`}
                >
                  <div className="admin-activity-item__icon">
                    {activity.icon}
                  </div>
                  <div className="admin-activity-item__content">
                    <h4 className="admin-activity-item__title">
                      {activity.title}
                    </h4>
                    <p className="admin-activity-item__description">
                      {activity.description}
                    </p>
                    <div className="admin-activity-item__time">
                      <Clock size={12} />
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="admin-home__system-status">
          <div className="admin-home__status-item">
            <div className="admin-home__status-header">
              <Activity size={20} className="admin-home__status-icon" />
              <h3 className="admin-home__status-title">System Status</h3>
            </div>
            <div className="admin-home__status-content">
              <div className="admin-home__status-badge admin-home__status-badge--healthy">
                <div className="admin-home__status-dot"></div>
                All systems operational
              </div>
            </div>
          </div>
          <div className="admin-home__status-item">
            <div className="admin-home__status-header">
              <MessageSquare size={20} className="admin-home__status-icon" />
              <h3 className="admin-home__status-title">Pending Reviews</h3>
            </div>
            <div className="admin-home__status-content">
              <span className="admin-home__status-number">12</span>
              <span className="admin-home__status-label">
                items need attention
              </span>
            </div>
          </div>
          <div className="admin-home__status-item">
            <div className="admin-home__status-header">
              <FileText size={20} className="admin-home__status-icon" />
              <h3 className="admin-home__status-title">Reports Generated</h3>
            </div>
            <div className="admin-home__status-content">
              <span className="admin-home__status-number">24</span>
              <span className="admin-home__status-label">this month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminHome
