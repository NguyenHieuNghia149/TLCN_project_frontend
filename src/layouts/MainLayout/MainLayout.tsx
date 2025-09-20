import React from 'react'
import Header from '../../components/Layout/Header/header'
import Footer from '../../components/Layout/Footer/footer'
import './MainLayout.scss'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="main-layout">
      <Header />
      <main className="main-layout-content" role="main">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
