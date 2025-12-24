import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import './App.css'

import router from './routes'
import { initializeSession, logoutUser } from './store/slices/authSlice'
import { ConfigProvider, App as AntdApp, theme as antdTheme, Spin } from 'antd'
import { useTheme } from '@/contexts/useTheme'
import { AppDispatch, RootState } from './store/stores'

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const { theme } = useTheme()

  // ✅ Wait for session initialization before rendering app
  const isSessionLoading = useSelector(
    (state: RootState) => state.auth.session.isLoading
  )

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

  // ✅ Show loading spinner while initializing session
  // This prevents API calls before access token is ready
  if (isSessionLoading) {
    return (
      <ConfigProvider
        theme={{
          algorithm:
            theme === 'dark'
              ? antdTheme.darkAlgorithm
              : antdTheme.defaultAlgorithm,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: theme === 'dark' ? '#141414' : '#ffffff',
          }}
        >
          <Spin size="large" tip="Loading..." />
        </div>
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider
      theme={{
        algorithm:
          theme === 'dark'
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
      }}
    >
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
