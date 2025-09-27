import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout/MainLayout'
import Login from '@/pages/auth/Login/Login'
import Register from '@/pages/auth/Login/Register'
import ForgotPassword from '@/pages/auth/Login/ForgotPassword'
import Profile from '@/pages/profile/Profile'
import HomePage from '@/pages/home/Home'

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
  {
    path: '/',
    element: <MainLayout />,
    children: [{ index: true, path: 'dashboard', element: <HomePage /> }],
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [{ path: 'dashboard', element: <HomePage /> }],
  },
])

export default router
