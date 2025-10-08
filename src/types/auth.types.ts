export interface User {
  id: string
  email: string
  firstname: string
  lastname: string
  role: string
  avatarUrl?: string
  createdAt: string
  lastLoginAt: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  firstname: string
  lastname: string
  confirmPassword: string
  verifyEmailCode: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface UpdateProfileData {
  user: User
}

export interface AuthContextType extends AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error?: Error | null
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
  clearError: () => void
  hasRole: (role: string) => boolean
}
