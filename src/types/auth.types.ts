export interface User {
  id: string
  email: string
  firstname: string
  lastname: string
  role: string
  avatar?: string
  rankingPoint?: number
  rank?: number
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
  passwordConfirm: string
  otp: string
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
