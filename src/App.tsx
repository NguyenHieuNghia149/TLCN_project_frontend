import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import './App.css'

import router from './routes'
import { initializeSession, logoutUser } from './store/slices/authSlice'
import { AppDispatch } from './store/stores'

function App() {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    // Initialize session on app load
    dispatch(initializeSession())

    // Listen for auth:failed event from axios interceptor
    // This happens when refresh token fails during API calls
    const handleAuthFailed = async () => {
      // Clear auth state and logout user
      // Navigation will be handled by ProtectedRoute components
      await dispatch(logoutUser())
    }

    window.addEventListener('auth:failed', handleAuthFailed)

    return () => {
      window.removeEventListener('auth:failed', handleAuthFailed)
    }
  }, [dispatch])

  return <RouterProvider router={router} />
}

export default App
