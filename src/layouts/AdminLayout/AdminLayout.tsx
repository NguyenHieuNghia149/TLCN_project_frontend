import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminNav from '@/components/admin/AdminNav/AdminNav'
import AdminHeader from '@/components/admin/AdminHeader/AdminHeader'
import './AdminLayout.scss'

interface AdminLayoutProps {
  children?: React.ReactNode
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="admin-layout">
      <AdminNav />
      <div className="admin-layout__main">
        <AdminHeader />
        <main className="admin-layout__content">{children || <Outlet />}</main>
      </div>
    </div>
  )
}

export default AdminLayout
