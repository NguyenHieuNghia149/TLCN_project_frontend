import { Suspense, useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import { App as AntdApp, ConfigProvider, Spin, theme as antdTheme } from 'antd'

import './App.css'
import { useTheme } from '@/contexts/useTheme'
import router from './routes'
import { initializeSession, logoutUser } from './store/slices/authSlice'
import { AppDispatch, RootState } from './store/stores'

let sessionBootInitializationInFlight: Promise<unknown> | null = null

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const { theme } = useTheme()
  const isSessionLoading = useSelector(
    (state: RootState) => state.auth.session.isLoading
  )

  useEffect(() => {
    if (!sessionBootInitializationInFlight) {
      const initializationRequest = Promise.resolve(
        dispatch(initializeSession())
      )
      const trackedInitialization = initializationRequest.finally(() => {
        if (sessionBootInitializationInFlight === trackedInitialization) {
          sessionBootInitializationInFlight = null
        }
      })
      sessionBootInitializationInFlight = trackedInitialization
    }

    const handleAuthFailed = async () => {
      await dispatch(logoutUser())
    }

    window.addEventListener('auth:failed', handleAuthFailed)

    return () => {
      window.removeEventListener('auth:failed', handleAuthFailed)
    }
  }, [dispatch])

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
          <Spin size="large" />
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
        <Toaster
          position="bottom-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: '14px',
            },
          }}
        />
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
              }}
            >
              <Spin size="large" />
            </div>
          }
        >
          <RouterProvider router={router} />
        </Suspense>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
