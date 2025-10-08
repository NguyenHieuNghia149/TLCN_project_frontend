import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/api/useAuth'

interface PublicRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * Route that redirects authenticated users away
 * Useful for login/register pages
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = '/dashboard',
}) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
