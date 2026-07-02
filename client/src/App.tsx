import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from './hooks/useAppDispatch'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import BooksPage from './pages/BooksPage'
import PersonalAreaPage from './pages/PersonalAreaPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const { isAuthenticated } = useAppSelector(s => s.auth)

  return (
    <div>
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" replace /> : <SignupPage />}
        />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/personal-area" element={<PersonalAreaPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App
