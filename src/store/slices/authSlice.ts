import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ApiError, authService } from '../../services/auth/auth.service'
import {
  extractErrorCode,
  isAuthenticationRecoveryCandidate,
  isTerminalRefreshError,
} from '@/config/api.config'
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

const initialState: AuthState = {
  session: { ...initialSessionState },
  login: initialLoginState,
  register: initialRegisterState,
}

function shouldClearSessionAfterRefreshFailure(error: unknown): boolean {
  return (
    isTerminalRefreshError(error) ||
    (error instanceof Error && error.message === 'Not authenticated') ||
    extractErrorCode(error) === 'AUTHENTICATION_ERROR' ||
    extractErrorCode(error) === '401'
  )
}

export const initializeSession = createAsyncThunk<
  User,
  void,
  {
    rejectValue: {
      message: string
      shouldClearSession: boolean
    }
  }
>('auth/initializeSession', async (_, { rejectWithValue }) => {
  try {
    return await authService.getCurrentUser()
  } catch (error) {
    if (!isAuthenticationRecoveryCandidate(error)) {
      return rejectWithValue({
        message:
          error instanceof Error
            ? error.message
            : 'Session initialization failed',
        shouldClearSession: false,
      })
    }

    try {
      return await authService.refreshToken()
    } catch (refreshError) {
      return rejectWithValue({
        message:
          refreshError instanceof Error
            ? refreshError.message
            : 'Session refresh unavailable',
        shouldClearSession: shouldClearSessionAfterRefreshFailure(refreshError),
      })
    }
  }
})

export const loginUser = createAsyncThunk<
  User,
  LoginCredentials,
  { rejectValue: ErrorPayload }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { user } = await authService.login(credentials)
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
  await authService.logout()
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
      firstName: data.firstname,
      lastName: data.lastname,
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
        if (action.payload?.shouldClearSession) {
          state.session = { ...initialSessionState, isLoading: false }
          return
        }

        state.session.isLoading = false
      })

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

    builder
      .addCase(logoutUser.pending, state => {
        state.session.isLoading = true
      })
      .addCase(logoutUser.fulfilled, state => {
        state.session = { ...initialSessionState, isLoading: false }
        state.login = initialLoginState
      })
      .addCase(logoutUser.rejected, state => {
        state.session = { ...initialSessionState, isLoading: false }
        state.login = initialLoginState
      })

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
