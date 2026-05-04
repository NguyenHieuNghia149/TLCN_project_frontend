import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
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
import { OwnerRoute } from './OwnerRoute'
import ChallengePage from '@/pages/challenge/ChallengePage'
import ProblemDetailPage from '@/pages/challengeDetail/ProblemDetailPage'
import Ranking from '@/pages/ranking/Ranking'
import BookmarksPage from '@/pages/bookmarks/BookmarksPage'
import ExamList from '@/pages/exam/list/ExamList'
import ExamAccessPage from '@/pages/exam/access/ExamAccessPage'
import ExamResults from '@/pages/exam/results/ExamResults'
import ExamResultsAdmin from '@/pages/exam/results/ExamResultsAdmin'
import ExamResultSubmissionDetail from '@/pages/exam/results/ExamResultSubmissionDetail'
import ExamChallengeDetail from '@/pages/exam/challenge/ExamChallengeDetail'
import LegacyExamRedirect from '@/pages/exam/legacy/LegacyExamRedirect'
import NotFound from '@/pages/NotFound'
import ManageTeacher from '@/pages/admin/manageteacher/ManageTeacher'
import ManageUser from '@/pages/admin/manageuser/ManageUser'
import ManageLesson from '@/pages/admin/managelesson/ManageLesson'
import ManageTopic from '@/pages/admin/managetopic/ManageTopic'
import AdminHome from '@/pages/admin/adminhome/AdminHome'
import UserSubmissionsPage from '@/pages/user/submissions/UserSubmissionsPage'
import AdminChallengeList from '@/pages/admin/challenge/AdminChallengeList'
import AdminCreateChallenge from '@/pages/admin/challenge/AdminCreateChallenge'
import AdminExamList from '@/pages/admin/exam/AdminExamList'
import AdminCreateExam from '@/pages/admin/exam/AdminCreateExam'
import ManageRoadmap from '@/pages/admin/manageroadmap/ManageRoadmap'
import RoadmapListPage from '@/pages/Roadmap/RoadmapListPage'
import RoadmapDetailPage from '@/pages/Roadmap/RoadmapDetailPage'
import UserRoadmapsPage from '@/pages/Roadmap/UserRoadmapsPage'
import RoadmapSelectionPage from '@/pages/Roadmap/RoadmapSelectionPage'
import ManageLanguages from '@/pages/admin/language/ManageLanguages'

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
    path: 'admin/roadmaps',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <ManageRoadmap />
          </AdminLayout>
        </TeacherRoute>
      </AdminThemeProvider>
    ),
  },
  {
    path: 'admin/teachers',
    element: (
      <AdminThemeProvider>
        <OwnerRoute>
          <AdminLayout>
            <ManageTeacher />
          </AdminLayout>
        </OwnerRoute>
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
    path: 'admin/challenges',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <AdminChallengeList />
          </AdminLayout>
        </TeacherRoute>
      </AdminThemeProvider>
    ),
  },
  {
    path: 'admin/languages',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <ManageLanguages />
          </AdminLayout>
        </TeacherRoute>
      </AdminThemeProvider>
    ),
  },
  {
    path: 'admin/challenges/create',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <AdminCreateChallenge />
          </AdminLayout>
        </TeacherRoute>
      </AdminThemeProvider>
    ),
  },
  {
    path: 'admin/challenges/edit/:id',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <AdminCreateChallenge />
          </AdminLayout>
        </TeacherRoute>
      </AdminThemeProvider>
    ),
  },
  {
    path: 'admin/exams',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <AdminExamList />
          </AdminLayout>
        </TeacherRoute>
      </AdminThemeProvider>
    ),
  },
  {
    path: 'admin/exams/create',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <AdminCreateExam />
          </AdminLayout>
        </TeacherRoute>
      </AdminThemeProvider>
    ),
  },
  {
    path: 'admin/exams/edit/:id',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <AdminCreateExam />
          </AdminLayout>
        </TeacherRoute>
      </AdminThemeProvider>
    ),
  },
  {
    path: 'admin/exams/:id/results',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <ExamResultsAdmin />
          </AdminLayout>
        </TeacherRoute>
      </AdminThemeProvider>
    ),
  },
  {
    path: 'admin/exams/:id/results/:participationId',
    element: (
      <AdminThemeProvider>
        <TeacherRoute>
          <AdminLayout>
            <ExamResultSubmissionDetail />
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
        element: <Navigate to="/dashboard" replace />,
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
        path: 'roadmaps',
        element: <RoadmapListPage />,
      },
      {
        path: 'roadmaps/:id',
        element: (
          <ProtectedRoute>
            <RoadmapDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'user/roadmaps',
        element: (
          <ProtectedRoute>
            <UserRoadmapsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'roadmaps/select',
        element: (
          <ProtectedRoute>
            <RoadmapSelectionPage />
          </ProtectedRoute>
        ),
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
        path: 'exam/:examSlug/results',
        element: (
          <ProtectedRoute>
            <ExamResults />
          </ProtectedRoute>
        ),
      },
      {
        path: 'exam/:id/manage',
        element: (
          <TeacherRoute>
            <AdminCreateExam />
          </TeacherRoute>
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
    element: <NotFound />,
  },
  {
    path: 'exam/:examSlug',
    element: <ExamAccessPage />,
  },
  {
    path: 'exam/:examSlug/entry',
    element: <ExamAccessPage />,
  },
  {
    path: 'exam/:examId/results',
    element: (
      <ProtectedRoute>
        <LegacyExamRedirect mode="results" />
      </ProtectedRoute>
    ),
  },
  {
    path: 'exam/:examId/challenge/:challengeId',
    element: (
      <ProtectedRoute>
        <LegacyExamRedirect mode="challenge" />
      </ProtectedRoute>
    ),
  },
  {
    path: 'exam/:examSlug/challenges/:challengeId',
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
