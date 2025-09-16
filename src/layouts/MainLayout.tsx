import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Layout/Header/header'
import Sidebar from '../components/Layout/Sidebar/sidebar'
import Footer from '../components/Layout/Footer/footer'
import './MainLayout.scss'

const MainLayout: React.FC = () => {
  return (
    <div className="main-layout">
      <Header />
      <div className="main-layout__content">
        <Sidebar />
        <main className="main-layout__main">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default MainLayout
