import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import Login from '@/pages/auth/Login/Login'
import Register from '@/pages/auth/Login/Register'
import ForgotPassword from '@/pages/auth/Login/ForgotPassword'
import Profile from '@/pages/profile/Profile'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/forgetpassword',
    element: <ForgotPassword />,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: 'profile',
        element: <Profile />,
      },
    ],
  },
])

export default router
