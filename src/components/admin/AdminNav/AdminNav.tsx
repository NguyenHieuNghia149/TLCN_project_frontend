import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/api/useAuth'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Code,
} from 'lucide-react'
import './AdminNav.scss'

interface NavItem {
  id: string
  label: string
  path: string
  icon: React.ReactNode
}

interface AdminNavProps {
  isCollapsed: boolean
  onToggle: () => void
}

const AdminNav: React.FC<AdminNavProps> = ({ isCollapsed, onToggle }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  // Internal state removed in favor of props

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/admin',
      icon: <LayoutDashboard size={20} />,
    },
    {
      id: 'users',
      label: 'Manage Users',
      path: '/admin/users',
      icon: <Users size={20} />,
    },
    {
      id: 'teachers',
      label: 'Manage Teachers',
      path: '/admin/teachers',
      icon: <Users size={20} />,
    },
    {
      id: 'lessons',
      label: 'Manage Lessons',
      path: '/admin/lessons',
      icon: <BookOpen size={20} />,
    },
    {
      id: 'topics',
      label: 'Manage Topics',
      path: '/admin/topics',
      icon: <FileText size={20} />,
    },
    {
      id: 'challenges',
      label: 'Manage Challenges',
      path: '/admin/challenges',
      icon: <Code size={20} />,
    },
  ]

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className={`admin-nav ${isCollapsed ? 'admin-nav--collapsed' : ''}`}>
      {/* Logo */}
      <div className="admin-nav__header">
        <div className="admin-nav__logo">
          {!isCollapsed && <span>Admin Panel</span>}
        </div>
        <button
          className="admin-nav__toggle"
          onClick={onToggle}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation Items */}
      <ul className="admin-nav__list">
        {navItems.map(item => (
          <li key={item.id} className="admin-nav__item">
            <button
              className={`admin-nav__link ${
                isActive(item.path) ? 'admin-nav__link--active' : ''
              }`}
              onClick={() => navigate(item.path)}
              title={isCollapsed ? item.label : ''}
            >
              <span className="admin-nav__icon">{item.icon}</span>
              {!isCollapsed && (
                <span className="admin-nav__label">{item.label}</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {/* Bottom Actions */}
      <div className="admin-nav__footer">
        <button
          className="admin-nav__action admin-nav__action--secondary"
          title={isCollapsed ? 'Settings' : ''}
        >
          <Settings size={20} />
          {!isCollapsed && <span>Settings</span>}
        </button>
        <button
          className="admin-nav__action admin-nav__action--logout"
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </nav>
  )
}

export default AdminNav
