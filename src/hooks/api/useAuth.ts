import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/stores'
import {
  clearLoginError,
  initializeSession,
  loginUser,
  logoutUser,
} from '@/store/slices/authSlice'
import type { LoginCredentials } from '../../types/auth.types'

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>()
  const session = useSelector((state: RootState) => state.auth.session)
  const loginState = useSelector((state: RootState) => state.auth.login)

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      await dispatch(loginUser(credentials)).unwrap()
    },
    [dispatch]
  )

  const logout = useCallback(async () => {
    await dispatch(logoutUser()).unwrap()
  }, [dispatch])

  const refreshAuth = useCallback(async () => {
    await dispatch(initializeSession()).unwrap()
  }, [dispatch])

  const clearError = useCallback(() => {
    dispatch(clearLoginError())
  }, [dispatch])

  const hasRole = useCallback(
    (role: string) => {
      return session.user?.role === role
    },
    [session.user]
  )

  return {
    user: session.user,
    isAuthenticated: session.isAuthenticated,
    isLoading: session.isLoading,
    error: loginState.error,
    login,
    logout,
    refreshAuth,
    clearError,
    hasRole,
  }
}
