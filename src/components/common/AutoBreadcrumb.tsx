import React, { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import Breadcrumb from '@/components/common/Breadcrumb'
import { getNavigationItems } from '@/config/routes.config'

const AutoBreadcrumb: React.FC = () => {
  const location = useLocation()

  const items = useMemo(() => {
    const found = getNavigationItems(location.pathname)
    return found.map((it, idx) => ({
      label: it.label,
      to: idx < found.length - 1 ? it.path : undefined,
    }))
  }, [location.pathname])

  if (!items || items.length === 0) return null

  return (
    <div className="container mx-auto px-6 py-4">
      <Breadcrumb items={items} />
    </div>
  )
}

export default AutoBreadcrumb
