import api, { setAccessToken } from '../../config/api.config'

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    firstname: string
    lastname: string
    email: string
    role: string
    avatarUrl?: string
  }
}

export class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const res = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      })
      setAccessToken(res.data.accessToken)
      return res.data
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response: { data: { message?: string } } }
        throw new Error(err.response.data.message || 'login failed')
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'request' in error
      ) {
        throw new Error('No response from server')
      } else if (error instanceof Error) {
        throw new Error('Error: ' + error.message)
      } else {
        throw new Error('An unknown error occurred')
      }
    }
  }

  async register(
    firstname: string,
    lastname: string,
    email: string,
    password: string,
    verifyEmailCode: string
  ): Promise<LoginResponse> {
    try {
      const res = await api.post<LoginResponse>('/auth/register', {
        firstname,
        lastname,
        email,
        password,
        verifyEmailCode,
      })
      setAccessToken(res.data.accessToken)
      return res.data
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response: { data: { message?: string } } }
        throw new Error(err.response.data.message || 'Registration failed')
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'request' in error
      ) {
        throw new Error('No response from server')
      } else if (error instanceof Error) {
        throw new Error('Error: ' + error.message)
      } else {
        throw new Error('An unknown error occurred')
      }
    }
  }
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
      setAccessToken(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw new Error('Logout failed')
    }
  }

  async refreshToken(): Promise<{ accessToken: string | undefined } | void> {
    try {
      const res = await api.post<{ accessToken: string }>(
        '/auth/refresh-token',
        {}
      )
      setAccessToken(res.data.accessToken)
      return res.data
    } catch (error) {
      console.error('Refresh token error:', error)
    }
  }

  async forgetPassword(
    email: string,
    opt: string,
    newPassword: string
  ): Promise<void> {
    try {
      const res = await api.post('/auth/forget-password', {
        email,
        opt,
        newPassword,
      })
      return res.data
    } catch (error) {
      console.error('Forget password error:', error)
      throw new Error('Forget password failed')
    }
  }

  // async getMe(): Promise<{ user: any } | void> {
  //   try {
  //     const res = await api.get<{ user: any }>('/auth/me')
  //     return res.data
  //   } catch (error) {
  //     console.error('Get me error:', error)
  //   }
  // }
}
