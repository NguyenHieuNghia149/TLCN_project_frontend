import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout/MainLayout'
import AdminLayout from '@/layouts/AdminLayout/AdminLayout'
import { AdminThemeProvider } from '@/contexts/AdminThemeContext'
import { PublicRoute } from './PublicRoute'
import { ProtectedRoute } from './ProtectedRoute'
import { TeacherRoute } from './TeacherRoute'
import { OwnerRoute } from './OwnerRoute'

const Login = React.lazy(() => import('@/pages/auth/Login/Login'))
const Register = React.lazy(() => import('@/pages/auth/register/Register'))
const ForgotPassword = React.lazy(
  () => import('@/pages/auth/forgotpassword/ForgotPassword')
)
const Profile = React.lazy(() => import('@/pages/profile/Profile'))
const Lessons = React.lazy(() => import('@/pages/lessons/Lessons'))
const HomePage = React.lazy(() => import('@/pages/home/Home'))
const LessonDetail = React.lazy(
  () => import('@/pages/LessonDetail/LessonDetail')
)
const TopicLessonsPage = React.lazy(
  () => import('@/pages/lessons/TopicLessonsPage')
)
const ChallengePage = React.lazy(
  () => import('@/pages/challenge/ChallengePage')
)
const ProblemDetailPage = React.lazy(
  () => import('@/pages/challengeDetail/ProblemDetailPage')
)
const Ranking = React.lazy(() => import('@/pages/ranking/Ranking'))
const BookmarksPage = React.lazy(
  () => import('@/pages/bookmarks/BookmarksPage')
)
const ExamList = React.lazy(() => import('@/pages/exam/list/ExamList'))
const ExamAccessPage = React.lazy(
  () => import('@/pages/exam/access/ExamAccessPage')
)
const ExamResults = React.lazy(() => import('@/pages/exam/results/ExamResults'))
const ExamResultsAdmin = React.lazy(
  () => import('@/pages/exam/results/ExamResultsAdmin')
)
const ExamResultSubmissionDetail = React.lazy(
  () => import('@/pages/exam/results/ExamResultSubmissionDetail')
)
const ExamChallengeDetail = React.lazy(
  () => import('@/pages/exam/challenge/ExamChallengeDetail')
)
const LegacyExamRedirect = React.lazy(
  () => import('@/pages/exam/legacy/LegacyExamRedirect')
)
const NotFound = React.lazy(() => import('@/pages/NotFound'))
const ManageTeacher = React.lazy(
  () => import('@/pages/admin/manageteacher/ManageTeacher')
)
const ManageUser = React.lazy(
  () => import('@/pages/admin/manageuser/ManageUser')
)
const ManageLesson = React.lazy(
  () => import('@/pages/admin/managelesson/ManageLesson')
)
const ManageTopic = React.lazy(
  () => import('@/pages/admin/managetopic/ManageTopic')
)
const AdminHome = React.lazy(() => import('@/pages/admin/adminhome/AdminHome'))
const UserSubmissionsPage = React.lazy(
  () => import('@/pages/user/submissions/UserSubmissionsPage')
)
const AdminChallengeList = React.lazy(
  () => import('@/pages/admin/challenge/AdminChallengeList')
)
const AdminCreateChallenge = React.lazy(
  () => import('@/pages/admin/challenge/AdminCreateChallenge')
)
const AdminExamList = React.lazy(
  () => import('@/pages/admin/exam/AdminExamList')
)
const AdminCreateExam = React.lazy(
  () => import('@/pages/admin/exam/AdminCreateExam')
)
const ManageRoadmap = React.lazy(
  () => import('@/pages/admin/manageroadmap/ManageRoadmap')
)
const RoadmapListPage = React.lazy(
  () => import('@/pages/Roadmap/RoadmapListPage')
)
const RoadmapDetailPage = React.lazy(
  () => import('@/pages/Roadmap/RoadmapDetailPage')
)
const UserRoadmapsPage = React.lazy(
  () => import('@/pages/Roadmap/UserRoadmapsPage')
)
const RoadmapSelectionPage = React.lazy(
  () => import('@/pages/Roadmap/RoadmapSelectionPage')
)
const ManageLanguages = React.lazy(
  () => import('@/pages/admin/language/ManageLanguages')
)

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
