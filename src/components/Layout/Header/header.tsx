import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './header.scss'

const Header: React.FC = () => {
  const location = useLocation()

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo">
          <Link to="/" className="logo-link">
            <span className="logo-icon">💻</span>
            <span className="logo-text">CodePractice</span>
          </Link>
        </div>

        <nav className="header__nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            to="/coding"
            className={`nav-link ${location.pathname === '/coding' ? 'active' : ''}`}
          >
            Coding Practice
          </Link>
        </nav>

        <div className="header__actions">
          <button className="header__button">Login</button>
        </div>
      </div>
    </header>
  )
}

export default Header
