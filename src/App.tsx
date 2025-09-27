import { RouterProvider } from 'react-router-dom'
import './App.css'
// import MainLayout from './layouts/MainLayout/MainLayout'
// import HomePage from './pages/home/Home'
import router from './routes'

function App() {
  // return (
  //   <BrowserRouter basename="/">
  //     <Routes>
  //       <Route
  //         path="/"
  //         element={
  //           <MainLayout>
  //             <Navigate to="/dashboard" replace />
  //           </MainLayout>
  //         }
  //       />
  //       <Route
  //         path="/dashboard"
  //         element={
  //           <MainLayout>
  //             <HomePage />
  //           </MainLayout>
  //         }
  //       />
  //     </Routes>
  //   </BrowserRouter>
  // )
  return <RouterProvider router={router} />
}

export default App
