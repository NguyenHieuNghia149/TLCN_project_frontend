import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { AuthContextProvider } from './authContext'
import { authService } from '../../services/auth/auth.service'
import { tokenManager } from '../../services/auth/token.service'
import {
  AuthState,
  LoginCredentials,
  AuthContextType,
  RegisterData,
  User,
} from '../../types/auth.types'

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  const handleAuthFailure = useCallback(() => {
    authService.clearAllAuthData()
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }, [])

  /**
   * Initialize authentication state on mount
   * - Attempt silent refresh using httpOnly cookie
   * - If success: set access token and fetch /me for user
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { accessToken } = await authService.refreshToken()
        tokenManager.setAccessToken(accessToken)

        // Fetch current user profile after obtaining access token
        const user: User = await authService.getCurrentUser()

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch {
        // Silent fail: treat as logged out
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    }

    initAuth()

    // Listen to global auth failure events (e.g., from axios interceptors)
    const onAuthFailed = () => handleAuthFailure()
    window.addEventListener('auth:failed', onAuthFailed as EventListener)

    // Cleanup on unmount
    return () => {
      window.removeEventListener('auth:failed', onAuthFailed as EventListener)
      tokenManager.destroy()
    }
  }, [handleAuthFailure])

  /**
   * Login user with credentials
   */
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true }))

        const { accessToken, user } = await authService.login(credentials)
        // Store access token in memory
        tokenManager.setAccessToken(accessToken)
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch (error) {
        handleAuthFailure()
        throw error
      }
    },
    [handleAuthFailure]
  )

  /**
   * Logout user and clear all auth data
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      authService.clearAllAuthData()

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }, [])

  /**
   * Manually refresh authentication (useful for forced refresh)
   */
  const refreshAuth = useCallback(async () => {
    try {
      const { accessToken } = await authService.refreshToken()
      tokenManager.setAccessToken(accessToken)
      const user = await authService.getCurrentUser()
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      authService.clearAllAuthData()
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
      throw error
    }
  }, [])

  const register = useCallback(async (userData: RegisterData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      const { accessToken, user } = await authService.register(userData)
      tokenManager.setAccessToken(accessToken)
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [])

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }))
  }, [])

  const hasRole = useCallback(
    (role: string) => {
      return authState.user?.role?.includes(role) ?? false
    },
    [authState.user]
  )

  const contextValue: AuthContextType = useMemo(
    () => ({
      ...authState,
      login,
      logout,
      refreshAuth,
      register,
      clearError,
      hasRole,
    }),
    [authState, login, logout, refreshAuth, register, clearError, hasRole]
  )

  return (
    <AuthContextProvider value={contextValue}>{children}</AuthContextProvider>
  )
}
