import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout/MainLayout'
import Login from '@/pages/auth/Login/Login'
import Register from '@/pages/auth/Login/Register'
import ForgotPassword from '@/pages/auth/Login/ForgotPassword'
import Profile from '@/pages/profile/Profile'
import HomePage from '@/pages/home/Home'
import { PublicRoute } from './PublicRoute'
import { ProtectedRoute } from './ProtectedRoute'
// import ProblemPage from '@/pages/problem/ProblemPage'
import ChallengePage from '@/pages/problem/ChallengePage'
export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        {' '}
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        {' '}
        <Register />
      </PublicRoute>
    ),
  },
  {
    path: '/forgetpassword',
    element: (
      <PublicRoute>
        {' '}
        <ForgotPassword />
      </PublicRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        {' '}
        <Profile />
      </ProtectedRoute>
    ),
  },

  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: <HomePage />,
      },
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'problem',
        element: <ChallengePage />,
      },
    ],
  },
])

export default router
