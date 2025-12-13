import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout/MainLayout'
import AdminLayout from '@/layouts/AdminLayout/AdminLayout'
import { AdminThemeProvider } from '@/contexts/AdminThemeContext'
import Login from '@/pages/auth/Login/Login'
import Register from '@/pages/auth/register/Register'
import ForgotPassword from '@/pages/auth/forgotpassword/ForgotPassword'
import Profile from '@/pages/profile/Profile'
import Lessons from '@/pages/lessons/Lessons'
import HomePage from '@/pages/home/Home'
import LessonDetail from '@/pages/LessonDetail/LessonDetail'
import TopicLessonsPage from '@/pages/lessons/TopicLessonsPage'
import { PublicRoute } from './PublicRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { TeacherRoute } from './TeacherRoute'
import ChallengePage from '@/pages/challenge/ChallengePage'
import ProblemDetailPage from '@/pages/challengeDetail/ProblemDetailPage'
import Ranking from '@/pages/ranking/Ranking'
import BookmarksPage from '@/pages/bookmarks/BookmarksPage'
import ExamList from '@/pages/exam/list/ExamList'
import ExamDetail from '@/pages/exam/detail/ExamDetail'
import ExamResults from '@/pages/exam/results/ExamResults'
import ExamResultsAdmin from '@/pages/exam/results/ExamResultsAdmin'
import ExamChallengeDetail from '@/pages/exam/challenge/ExamChallengeDetail'
import NotFound from '@/pages/NotFound'
import ManageTeacher from '@/pages/admin/manageteacher/ManageTeacher'
import ManageUser from '@/pages/admin/manageuser/ManageUser'
import ManageLesson from '@/pages/admin/managelesson/ManageLesson'
import ManageTopic from '@/pages/admin/managetopic/ManageTopic'
import AdminHome from '@/pages/admin/adminhome/AdminHome'
import UserSubmissionsPage from '@/pages/user/submissions/UserSubmissionsPage'

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
    path: 'admin',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <AdminHome />
          </AdminLayout>
        </TeacherRoute>
      </AdminThemeProvider>
    ),
  },
  {
    path: 'admin/users',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <ManageUser />
          </AdminLayout>
        </TeacherRoute>
      </AdminThemeProvider>
    ),
  },
  {
    path: 'admin/teachers',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <ManageTeacher />
          </AdminLayout>
        </TeacherRoute>
      </AdminThemeProvider>
    ),
  },
  {
    path: 'admin/lessons',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <ManageLesson />
          </AdminLayout>
        </TeacherRoute>
      </AdminThemeProvider>
    ),
  },
  {
    path: 'admin/topics',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <ManageTopic />
          </AdminLayout>
        </TeacherRoute>
      </AdminThemeProvider>
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
        path: 'lessons/topic/:topicId',
        element: <TopicLessonsPage />,
      },
      {
        path: 'lessons/:lessonId',
        element: <LessonDetail />,
      },
      {
        path: 'leaderboard',
        element: <Ranking />,
      },
      {
        path: 'dashboard/bookmarks',
        element: (
          <ProtectedRoute>
            <BookmarksPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/dashboard/submissions',
        element: (
          <ProtectedRoute>
            <UserSubmissionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exam/:examId/results',
        element: (
          <ProtectedRoute>
            <ExamResults />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exam',
        element: (
          <ProtectedRoute>
            <ExamList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exam/:examId/results/manage',
        element: (
          <TeacherRoute>
            <ExamResultsAdmin />
          </TeacherRoute>
        ),
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

  {
    path: 'exam/create',
    element: (
      <MainLayout>
        <NotFound />
      </MainLayout>
    ),
  },
  {
    path: 'exam/:examId',
    element: (
      <ProtectedRoute>
        <ExamDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: 'exam/:examId/challenge/:challengeId/',
    element: (
      <ProtectedRoute>
        <ExamChallengeDetail />
      </ProtectedRoute>
    ),
  },

  {
    path: '*',
    element: (
      <MainLayout>
        <NotFound />
      </MainLayout>
    ),
  },
])

export default router
