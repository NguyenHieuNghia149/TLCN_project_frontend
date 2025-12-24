export const API_CONFIG = {
  baseURL:
    import.meta.env.REACT_APP_API_URL || 'https://api.algoforge.site/api',
  //import.meta.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  withCredentials: true,
} as const

export const STORAGE_KEYS = {
  USER: 'auth_user',
  IS_AUTHENTICATED: 'auth_is_authenticated',
} as const
