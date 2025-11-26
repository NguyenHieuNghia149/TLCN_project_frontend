import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authService, ApiError } from '../../services/auth/auth.service'
import { STORAGE_KEYS } from '@/config/api.config'
import type {
  LoginCredentials,
  RegisterData as ClientRegisterData,
  User,
} from '../../types/auth.types'

type PendingRegistration = {
  firstname: string
  lastname: string
  email: string
  password: string
  passwordConfirm?: string
}

type RegisterWithOtp = PendingRegistration & { otp: string }

type ErrorPayload = {
  message: string
  fieldErrors?: Record<string, string>
}

type SessionState = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

type LoginState = {
  isLoading: boolean
  error: string | null
  fieldErrors: Record<string, string>
  lastAttempt: LoginCredentials | null
}

type RegisterState = {
  isLoading: boolean
  isOtpSent: boolean
  otpCooldown: number
  error: string | null
  fieldErrors: Record<string, string>
  registrationEmail: string | null
  step: 'register' | 'verify-otp'
  pendingRegistration: PendingRegistration | null
}

interface AuthState {
  session: SessionState
  login: LoginState
  register: RegisterState
}

const initialSessionState: SessionState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  // isLaoding: true,
}

const initialLoginState: LoginState = {
  isLoading: false,
  error: null,
  fieldErrors: {},
  lastAttempt: null,
}

const initialRegisterState: RegisterState = {
  isLoading: false,
  isOtpSent: false,
  otpCooldown: 0,
  error: null,
  fieldErrors: {},
  registrationEmail: null,
  step: 'register',
  pendingRegistration: null,
}

const persistSessionSnapshot = (
  user: User | null,
  isAuthenticated: boolean
) => {
  if (typeof window === 'undefined') return
  try {
    if (user && isAuthenticated) {
      window.localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
      window.localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true')
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.USER)
      window.localStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED)
    }
  } catch {
    // Ignore storage errors to keep auth flow running
  }
}

const hydrateSessionState = (): SessionState => {
  if (typeof window === 'undefined') {
    return { ...initialSessionState }
  }

  try {
    const storedAuth =
      window.localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) === 'true'
    const storedUser = window.localStorage.getItem(STORAGE_KEYS.USER)

    if (storedAuth && storedUser) {
      const user = JSON.parse(storedUser) as User
      return {
        user,
        isAuthenticated: true,
        // Keep loading spinner while we validate refresh token server-side
        isLoading: true,
      }
    }
  } catch {
    // Fall back to default if parsing fails
  }

  return { ...initialSessionState }
}

const initialState: AuthState = {
  session: hydrateSessionState(),
  login: initialLoginState,
  register: initialRegisterState,
}

// Async thunks
export const initializeSession = createAsyncThunk<
  User,
  void,
  { rejectValue: { message: string; isRefreshTokenExpired: boolean } }
>('auth/refreshToken', async (_, { rejectWithValue }) => {
  try {
    const { accessToken } = await authService.refreshToken()
    if (!accessToken) {
      throw new Error('Missing access token')
    }
    const user = await authService.getCurrentUser()
    persistSessionSnapshot(user, true)
    return user
  } catch (error) {
    // Check if refresh token is expired or revoked - this means true logout
    // Only logout if explicitly expired/revoked, not for NO_REFRESH_TOKEN (could be cookie path issue)
    const isRefreshTokenExpired =
      error instanceof Error &&
      (error.message === 'Refresh token expired or revoked' ||
        (error as { code?: string }).code === 'REFRESH_TOKEN_EXPIRED' ||
        (error as { code?: string }).code === 'TOKEN_EXPIRED')

    if (isRefreshTokenExpired) {
      // Refresh token expired/revoked - clear everything and logout
      authService.clearAllAuthData()
      persistSessionSnapshot(null, false)
      return rejectWithValue({
        message: 'Refresh token expired or revoked',
        isRefreshTokenExpired: true,
      })
    }

    // Other errors (network, cookie not sent, NO_REFRESH_TOKEN, etc.) - clear token in memory but keep localStorage
    // This allows the reducer to re-hydrate from localStorage if available
    // NO_REFRESH_TOKEN could mean cookie not sent due to path mismatch, so don't logout
    authService.clearAllAuthData()
    return rejectWithValue({
      message: 'Not authenticated',
      isRefreshTokenExpired: false,
    })
  }
})

export const loginUser = createAsyncThunk<
  User,
  LoginCredentials,
  { rejectValue: ErrorPayload }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { user } = await authService.login(credentials)
    persistSessionSnapshot(user, true)
    return user
  } catch (error) {
    if (error instanceof ApiError) {
      const fieldErrors =
        error.fieldErrors?.reduce<Record<string, string>>((acc, fieldError) => {
          acc[fieldError.field] = fieldError.message
          return acc
        }, {}) ?? undefined

      return rejectWithValue({
        message: error.message || 'Login failed',
        fieldErrors,
      })
    }

    return rejectWithValue({
      message: error instanceof Error ? error.message : 'Login failed',
    })
  }
})

export const loginWithGoogle = createAsyncThunk<
  User,
  string,
  { rejectValue: ErrorPayload }
>('auth/loginWithGoogle', async (idToken, { rejectWithValue }) => {
  try {
    const { user } = await authService.loginWithGoogle(idToken)
    persistSessionSnapshot(user, true)
    return user
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue({ message: error.message })
    }
    return rejectWithValue({
      message: error instanceof Error ? error.message : 'Google login failed',
    })
  }
})

export const logoutUser = createAsyncThunk<void>('auth/logout', async () => {
  try {
    await authService.logout()
  } finally {
    persistSessionSnapshot(null, false)
  }
})

export const sendOTP = createAsyncThunk<
  string,
  string,
  { rejectValue: ErrorPayload }
>('auth/send-verification-email', async (email, { rejectWithValue }) => {
  try {
    await authService.requestRegisterOtp(email)
    return email
  } catch (error) {
    if (error instanceof ApiError) {
      return rejectWithValue({ message: error.message })
    }
    return rejectWithValue({ message: 'Failed to send OTP' })
  }
})

export const registerUser = createAsyncThunk<
  { email: string },
  RegisterWithOtp,
  { rejectValue: ErrorPayload }
>('auth/register', async (data, { rejectWithValue }) => {
  try {
    const payload: ClientRegisterData = {
      email: data.email,
      password: data.password,
      passwordConfirm: data.password,
      firstname: data.firstname,
      lastname: data.lastname,
      otp: data.otp,
    }
    await authService.register(payload)
    return { email: data.email }
  } catch (error) {
    if (error instanceof ApiError) {
      const fieldErrors =
        error.fieldErrors?.reduce<Record<string, string>>((acc, fieldError) => {
          acc[fieldError.field] = fieldError.message
          return acc
        }, {}) ?? undefined

      return rejectWithValue({
        message: error.message || 'Registration failed',
        fieldErrors,
      })
    }
    return rejectWithValue({ message: 'Registration failed' })
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.register.error = null
      state.register.fieldErrors = {}
    },
    clearFieldError: (state, action: PayloadAction<string>) => {
      delete state.register.fieldErrors[action.payload]
    },
    setStep: (state, action: PayloadAction<'register' | 'verify-otp'>) => {
      state.register.step = action.payload
    },
    setPendingRegistration: (
      state,
      action: PayloadAction<PendingRegistration | null>
    ) => {
      state.register.pendingRegistration = action.payload
    },
    decrementCooldown: state => {
      if (state.register.otpCooldown > 0) {
        state.register.otpCooldown -= 1
      }
    },
    resetAuth: state => {
      state.register = initialRegisterState
    },
    clearLoginError: state => {
      state.login.error = null
      state.login.fieldErrors = {}
    },
    clearLoginFieldError: (state, action: PayloadAction<string>) => {
      delete state.login.fieldErrors[action.payload]
    },
  },
  extraReducers: builder => {
    // Initialize session
    builder
      .addCase(initializeSession.pending, state => {
        state.session.isLoading = true
      })
      .addCase(initializeSession.fulfilled, (state, action) => {
        state.session.user = action.payload
        state.session.isAuthenticated = true
        state.session.isLoading = false
      })
      .addCase(initializeSession.rejected, (state, action) => {
        const isRefreshTokenExpired =
          action.payload?.isRefreshTokenExpired ?? false

        // If refresh token is expired or revoked, clear everything - true logout
        if (isRefreshTokenExpired) {
          state.session = { ...initialSessionState, isLoading: false }
          return
        }

        // For other errors (network, cookie not sent, etc.), try to re-hydrate from localStorage
        // This allows user to stay "logged in" UI-wise while we retry refresh
        // This is especially important when cookie path mismatch prevents cookie from being sent
        try {
          if (typeof window !== 'undefined') {
            const storedAuth =
              window.localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED) ===
              'true'
            const storedUser = window.localStorage.getItem(STORAGE_KEYS.USER)

            if (storedAuth && storedUser) {
              // Re-hydrate from localStorage - refresh token may have failed temporarily
              // Keep user info and let them stay "logged in" until they navigate
              // to a protected route that requires fresh auth
              // Note: API calls may fail until refresh token succeeds, but UI will show logged in state
              const user = JSON.parse(storedUser) as User
              state.session.user = user
              state.session.isAuthenticated = true
              state.session.isLoading = false
              return
            }
          }
        } catch (error) {
          // Log error for debugging
          console.warn('Failed to re-hydrate from localStorage:', error)
          // Fall through to clear state if hydration fails
        }

        // No stored auth or hydration failed - clear everything
        state.session = { ...initialSessionState, isLoading: false }
      })

    // Login
    builder
      .addCase(loginUser.pending, (state, action) => {
        state.login.isLoading = true
        state.login.error = null
        state.login.fieldErrors = {}
        state.session.isLoading = true
        state.login.lastAttempt = action.meta.arg
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.login.isLoading = false
        state.session.user = action.payload
        state.session.isAuthenticated = true
        state.session.isLoading = false
        state.login.lastAttempt = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.login.isLoading = false
        state.session.isLoading = false
        state.session.isAuthenticated = false
        state.session.user = null
        state.login.error = action.payload?.message || 'Login failed'
        if (action.payload?.fieldErrors) {
          state.login.fieldErrors = action.payload.fieldErrors
        }
        state.login.lastAttempt = action.meta.arg
      })

    // Login with Google
    builder
      .addCase(loginWithGoogle.pending, state => {
        state.login.isLoading = true
        state.login.error = null
        state.session.isLoading = true
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.login.isLoading = false
        state.session.user = action.payload
        state.session.isAuthenticated = true
        state.session.isLoading = false
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.login.isLoading = false
        state.session.isLoading = false
        state.login.error = action.payload?.message || 'Google login failed'
      })

    // Logout
    builder
      .addCase(logoutUser.pending, state => {
        state.session.isLoading = true
      })
      .addCase(logoutUser.fulfilled, state => {
        // Reset to initial state but set isLoading to false to allow redirect
        state.session = { ...initialSessionState, isLoading: false }
        state.login = initialLoginState
      })
      .addCase(logoutUser.rejected, state => {
        // Even if logout fails, clear auth state and allow redirect
        state.session = { ...initialSessionState, isLoading: false }
        state.login = initialLoginState
      })

    // Send OTP
    builder
      .addCase(sendOTP.pending, state => {
        state.register.isLoading = true
        state.register.error = null
        state.register.fieldErrors = {}
      })
      .addCase(sendOTP.fulfilled, (state, action: PayloadAction<string>) => {
        state.register.isLoading = false
        state.register.isOtpSent = true
        state.register.otpCooldown = 60
        state.register.registrationEmail = action.payload
        state.register.step = 'verify-otp'
      })
      .addCase(
        sendOTP.rejected,
        (state, action: PayloadAction<ErrorPayload | undefined>) => {
          state.register.isLoading = false
          state.register.error = action.payload?.message || 'Failed to send OTP'
          if (action.payload?.fieldErrors) {
            state.register.fieldErrors = action.payload.fieldErrors
          }
        }
      )

    // Register (finalize after OTP entered)
    builder
      .addCase(registerUser.pending, state => {
        state.register.isLoading = true
        state.register.error = null
        state.register.fieldErrors = {}
      })
      .addCase(registerUser.fulfilled, state => {
        state.register.isLoading = false
        state.register.pendingRegistration = null
      })
      .addCase(
        registerUser.rejected,
        (state, action: PayloadAction<ErrorPayload | undefined>) => {
          state.register.isLoading = false
          state.register.error =
            action.payload?.message || 'Registration failed'
          if (action.payload?.fieldErrors) {
            state.register.fieldErrors = action.payload.fieldErrors
          }
        }
      )
  },
})

export const {
  clearError,
  clearFieldError,
  setStep,
  setPendingRegistration,
  decrementCooldown,
  resetAuth,
  clearLoginError,
  clearLoginFieldError,
} = authSlice.actions
export default authSlice.reducer
