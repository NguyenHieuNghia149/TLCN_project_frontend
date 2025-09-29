import axios from 'axios'

let accessToken: string | null = null // lưu access_token trong memory

export const config = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
}
export const setAccessToken = (token: string | null) => {
  accessToken = token
}

const axiosIntance = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

axiosIntance.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

axiosIntance.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config

    // Nếu access_token hết hạn → thử refresh
    if (
      err.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true
      try {
        const res = await axios.post(
          'http://localhost:3001/auth/refresh-token',
          {},
          { withCredentials: true }
        )
        const newAccessToken = res.data.accessToken
        setAccessToken(newAccessToken)

        // Gửi lại request cũ
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return axiosIntance(originalRequest)
      } catch (refreshErr) {
        console.error('Refresh token invalid or expired', refreshErr)
        window.location.href = '/login' // logout
      }
    }

    return Promise.reject(err)
  }
)

// export const getApiUrl = (endpoint) => {
//   // Loại bỏ dấu / ở đầu để tránh double slashes
//   const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint
//   return `${config.baseURL}/${path}`
// }

const api = axiosIntance
export default api
