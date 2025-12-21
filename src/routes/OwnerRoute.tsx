import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/api/useAuth'
import { isOwner } from '@/utils/roleUtils'

interface OwnerRouteProps {
  children: React.ReactNode
  redirectTo?: string
  fallbackPath?: string
}

const LoadingSplash = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="text-center">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-500"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
)

export const OwnerRoute: React.FC<OwnerRouteProps> = ({
  children,
  redirectTo = '/login',
  fallbackPath = '/dashboard',
}) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingSplash />
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  if (!isOwner(user)) {
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}

export default OwnerRoute
