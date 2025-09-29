// import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
// import axios, { AxiosError } from 'axios';

// interface User {
//   id: number;
//   email: string;
//   name: string;
// }

// interface AuthContextType {
//   user: User | null;
//   login: (email: string, password: string) => Promise<void>;
//   register: (email: string, password: string, name: string) => Promise<void>;
//   logout: () => Promise<void>;
//   loading: boolean;
//   error: string | null;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const api = axios.create({
//   baseURL: 'http://localhost:3001/api',
//   withCredentials: true,
// });

// // Request interceptor to add access token
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('accessToken');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // Response interceptor to handle token refresh
// api.interceptors.response.use(
//   (response) => response,
//   async (error: AxiosError) => {
//     const original = error.config;

//     if (error.response?.status === 403 && original && !original._retry) {
//       original._retry = true;

//       try {
//         const response = await api.post('/auth/refresh');
//         const { accessToken } = response.data;
//         localStorage.setItem('accessToken', accessToken);

//         // Retry original request
//         if (original.headers) {
//           original.headers.Authorization = `Bearer ${accessToken}`;
//         }
//         return api(original);
//       } catch (refreshError) {
//         localStorage.removeItem('accessToken');
//         window.location.href = '/login';
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const  [isLogin, setIsLogin] = useState(() => {
//     return !!localStorage.getItem('accessToken');
//   });

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   const checkAuth = async () => {
//     try {
//       const token = localStorage.getItem('accessToken');
//       if (token) {
//         const response = await api.get('/auth/me');
//         setUser(response.data.user);
//         setIsLogin(true);
//       }
//     } catch (error) {
//       localStorage.removeItem('accessToken');
//       localStorage.removeItem('user');
//       setIsLogin(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const login = async (email: string, password: string) => {
//     try {
//       setError(null);
//       setLoading(true);

//       const response = await api.post('/auth/login', { email, password });
//       const { user, accessToken } = response.data;

//       localStorage.setItem('accessToken', accessToken);
//       setUser(user);
//     } catch (error) {
//       const axiosError = error as AxiosError<{ error: string }>;
//       setError(axiosError.response?.data?.error || 'Login failed');
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const register = async (email: string, password: string, name: string) => {
//     try {
//       setError(null);
//       setLoading(true);

//       const response = await api.post('/auth/register', { email, password, name });
//       const { user, accessToken } = response.data;

//       localStorage.setItem('accessToken', accessToken);
//       setUser(user);
//     } catch (error) {
//       const axiosError = error as AxiosError<{ error: string }>;
//       setError(axiosError.response?.data?.error || 'Registration failed');
//       throw error;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = async () => {
//     try {
//       await api.post('/auth/logout');
//     } catch (error) {
//       console.error('Logout error:', error);
//     } finally {
//       localStorage.removeItem('accessToken');
//       setUser(null);
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };
