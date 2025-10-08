import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './nav.scss'

interface NavItem {
  label: string
  path: string
}

interface NavigationProps {
  items: NavItem[]
}

const Navigation: React.FC<NavigationProps> = ({ items }) => {
  const location = useLocation()

  return (
    <nav className="nav-breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={item.path}>
          <Link
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.label}
          </Link>
          {index < items.length - 1 && (
            <span className="nav-item separator">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

export default Navigation
