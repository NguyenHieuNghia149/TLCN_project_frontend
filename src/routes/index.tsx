import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Dashboard from '../pages/dashboard/Dashboard'
import CodingPractice from '../pages/coding/CodingPractice'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'coding',
        element: <CodingPractice />,
      },
    ],
  },
  {},
])
