import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminNav from '@/components/admin/AdminNav/AdminNav'
import AdminHeader from '@/components/admin/AdminHeader/AdminHeader'
import './AdminLayout.scss'

interface AdminLayoutProps {
  children?: React.ReactNode
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  return (
    <div className="admin-layout">
      <AdminNav
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />
      <div
        className={`admin-layout__main ${isCollapsed ? 'admin-layout__main--collapsed' : ''}`}
      >
        <AdminHeader />
        <main className="admin-layout__content">{children || <Outlet />}</main>
      </div>
    </div>
  )
}

export default AdminLayout
