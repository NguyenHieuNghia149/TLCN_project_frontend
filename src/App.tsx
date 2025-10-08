import { RouterProvider } from 'react-router-dom'
import './App.css'

import router from './routes'
import { AuthProvider } from './contexts/AuthContext/authProvider'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
