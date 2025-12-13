import React, { useState } from 'react'
import { useAdminTheme } from '@/hooks/useAdminTheme'
import { useAuth } from '@/hooks/api/useAuth'
import { Moon, Sun, Bell } from 'lucide-react'
import './AdminHeader.scss'

const AdminHeader: React.FC = () => {
  const { adminTheme, toggleAdminTheme } = useAdminTheme()
  const { user } = useAuth()
  const [showUserInfo, setShowUserInfo] = useState(false)

  const getAvatarUrl = () => {
    // Get user avatar URL
    if (user?.avatar) {
      return user.avatar
    }
    return null
  }

  const getInitials = () => {
    if (user?.firstname && user?.lastname) {
      return `${user.firstname[0]}${user.lastname[0]}`.toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  return (
    <header className="admin-header">
      <div className="admin-header__container">
        {/* Right side actions */}
        <div className="admin-header__actions">
          {/* Theme toggle */}
          <button
            className="admin-header__btn admin-header__btn--theme"
            onClick={toggleAdminTheme}
            title={
              adminTheme === 'dark'
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
          >
            {adminTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <button
            className="admin-header__btn admin-header__btn--notification"
            title="Notifications"
          >
            <Bell size={20} />
            <span className="admin-header__badge">3</span>
          </button>

          {/* User profile avatar */}
          <div className="admin-header__user-profile">
            <button
              className="admin-header__avatar-btn"
              title="User profile"
              onClick={() => setShowUserInfo(!showUserInfo)}
            >
              <div className="admin-header__avatar">
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl() || ''}
                    alt={`${user?.firstname} ${user?.lastname}`}
                    className="admin-header__avatar-img"
                  />
                ) : (
                  <span className="admin-header__avatar-initials">
                    {getInitials()}
                  </span>
                )}
              </div>
            </button>

            {/* User info popup */}
            {showUserInfo && (
              <div className="admin-header__user-info-popup">
                <p className="admin-header__user-name">
                  {user?.firstname && user?.lastname
                    ? `${user.firstname} ${user.lastname}`
                    : 'User'}
                </p>
                <p className="admin-header__user-email">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader
