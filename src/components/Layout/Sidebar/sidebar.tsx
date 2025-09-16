import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './sidebar.scss'

const Sidebar: React.FC = () => {
  const location = useLocation()

  const menuItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: '🏠',
    },
    {
      path: '/coding',
      label: 'Coding Practice',
      icon: '💻',
    },
  ]

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar__item ${
              location.pathname === item.path ? 'active' : ''
            }`}
          >
            <span className="sidebar__icon">{item.icon}</span>
            <span className="sidebar__label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
