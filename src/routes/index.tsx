import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout/MainLayout'
import Login from '@/pages/auth/Login/Login'
import Register from '@/pages/auth/register/Register'
import ForgotPassword from '@/pages/auth/forgotpassword/ForgotPassword'
import Profile from '@/pages/profile/Profile'
import Lessons from '@/pages/lessons/Lessons'
import HomePage from '@/pages/home/Home'
import LessonDetail from '@/pages/LessonDetail/LessonDetail'
import { PublicRoute } from './PublicRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { TeacherRoute } from './TeacherRoute'
import ChallengePage from '@/pages/challenge/ChallengePage'
import ProblemDetailPage from '@/pages/challengeDetail/ProblemDetailPage'
import Ranking from '@/pages/ranking/Ranking'
import BookmarksPage from '@/pages/bookmarks/BookmarksPage'
import ExamList from '@/pages/exam/list/ExamList'
import ExamDetail from '@/pages/exam/detail/ExamDetail'
import StudentExam from '@/pages/exam/session/StudentExam'
import ExamResults from '@/pages/exam/results/ExamResults'
import ExamResultsAdmin from '@/pages/exam/results/ExamResultsAdmin'
import ExamSubmissionDetail from '@/pages/exam/results/ExamSubmissionDetail'
import ExamChallengeDetail from '@/pages/exam/challenge/ExamChallengeDetail'
import NotFound from '@/pages/NotFound'
import ManageTeacher from '@/pages/admin/manageteacher/ManageTeacher'
import ManageUser from '@/pages/admin/manageuser/ManageUser'
import ManageLesson from '@/pages/admin/managelesson/ManageLesson'
import AdminHome from '@/pages/admin/adminhome/AdminHome'
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
    path: 'admin',
    element: (
      <ProtectedRoute>
        <AdminHome />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/users',
    element: (
      <ProtectedRoute>
        <ManageUser />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/teachers',
    element: (
      <ProtectedRoute>
        <ManageTeacher />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/lessons',
    element: (
      <ProtectedRoute>
        <ManageLesson />
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
    path: 'exam/:examId/challenge/:challengeId',
    element: (
      <ProtectedRoute>
        <StudentExam />
      </ProtectedRoute>
    ),
  },
  {
    path: 'exam/:examId/challenge/:challengeId/preview',
    element: (
      <ProtectedRoute>
        <ExamChallengeDetail />
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
  {
    path: 'exam/:examId/submission/:submissionId',
    element: (
      <ProtectedRoute>
        <ExamSubmissionDetail />
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
