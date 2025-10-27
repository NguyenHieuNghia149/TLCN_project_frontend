import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout/MainLayout'
import Login from '@/pages/auth/Login/Login'
import Register from '@/pages/register/Register'
import ForgotPassword from '@/pages/forgotpassword/ForgotPassword'
import Profile from '@/pages/profile/Profile'
import Lessons from '@/pages/lessons/Lessons'
import HomePage from '@/pages/home/Home'
import LessonDetail from '@/pages/LessonDetail/LessonDetail'
import { PublicRoute } from './PublicRoute'
import { ProtectedRoute } from './ProtectedRoute'
import ChallengePage from '@/pages/challenge/ChallengePage'
import ProblemDetailPage from '@/pages/challengeDetail/ProblemDetailPage'
import Ranking from '@/pages/ranking/Ranking'
// removed unused import

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
        path: 'dashboard/challenge/:challengeId',
        element: <ChallengePage />,
      },
      {
        path: 'lessons',
        element: <Lessons />,
      },
      {
        path: 'lessons/:lessonId',
        element: <LessonDetail />,
      },
      {
        path: 'ranking',
        element: <Ranking />,
      },
    ],
  },
  {
    path: '/problems/:id',
    element: (
      <ProtectedRoute>
        <ProblemDetailPage />
      </ProtectedRoute>
    ),
  },
])

export default router
