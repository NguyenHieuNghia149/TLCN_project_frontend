import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Search,
  MessageCircle,
  Bell,
  Sun,
  Grid3X3,
  ChevronDown,
} from 'lucide-react'

import './header.scss'
const Header: React.FC = () => {
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', label: 'Prepare' },
    { path: '/certify', label: 'Certify' },
    { path: '/compete', label: 'Compete' },
    { path: '/apply', label: 'Apply' },
  ]

  const profileItems = [
    { key: 'profile', label: 'Profile' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'settings', label: 'Settings' },
    { key: 'bookmarks', label: 'Bookmarks' },
    { key: 'network', label: 'Network' },
    { key: 'submissions', label: 'Submissions' },
    { key: 'administration', label: 'Administration' },
    { key: 'logout', label: 'Logout' },
  ]

  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const profileRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!profileRef.current) return
      if (!profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <header className="main-header-layout w-full">
      <div className="w-full">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation Section */}
          <div className="nav-section-header max-[550]: flex items-center">
            <Link to="/" className="flex items-center space-x-1">
              <span className="text-2xl font-bold text-white">CodeGym</span>
              <div className="h-3 w-3 bg-green-500"></div>
            </Link>

            {/* Separator */}
            <div className="header-separator"></div>

            {/* Navigation */}
            <nav className="flex">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`header-nav-item ${
                    location.pathname === item.path ? 'active' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Section - Search and Icons */}
          <div className="header-right-section flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search"
                className="block h-9 w-60 rounded-lg border border-gray-600 bg-transparent py-2.5 pl-10 pr-3 text-sm text-white placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>

            {/* Utility Icons */}
            <div className="flex items-center space-x-3">
              <button className="nav-icon text-white transition-colors hover:text-white">
                <MessageCircle className="h-5 w-5" />
              </button>
              <button className="nav-icon text-white transition-colors hover:text-white">
                <Bell className="h-5 w-5" />
              </button>
              <button className="nav-icon text-white transition-colors hover:text-white">
                <Sun className="h-5 w-5" />
              </button>
              <button className="nav-icon text-white transition-colors hover:text-white">
                <Grid3X3 className="h-5 w-5" />
              </button>
            </div>

            {/* User Profile Button */}
            <div className="relative flex items-center" ref={profileRef}>
              <button
                className="header-icon flex h-10 w-14 items-center justify-between rounded-md px-0"
                onClick={() => setIsProfileOpen(v => !v)}
              >
                <div className="ml-1 flex h-full w-10 items-center justify-center">
                  <div className="h-8 w-8 overflow-hidden rounded-full">
                    <img
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <ChevronDown className="h-3 w-3 text-gray-300" />
                </div>
              </button>

              {isProfileOpen && (
                <div className="profile-menu absolute right-0 top-full mt-2">
                  <ul>
                    {profileItems.map(item => (
                      <li key={item.key}>
                        <button className="profile-menu__item" type="button">
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
