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
    path: '/profile',
    element: <Profile />,
  },
  {
    path: '/lessons',
    element: <Lessons />,
  },
  {
    path: '/lessondetail',
    element: <LessonDetail />,
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
