import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './hooks/useAppDispatch'
import { logout } from './store/authSlice'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector(s => s.auth)

  return (
    <div>
      <nav>
        <Link to="/" className="nav-brand">ספריית העיר</Link>
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <span className="nav-greeting">שלום, {user?.name}</span>
              <button className="nav-btn-logout" onClick={() => dispatch(logout())}>
                יציאה
              </button>
            </>
          ) : (
            <>
              <Link to="/login">כניסה</Link>
              <Link to="/signup">הרשמה</Link>
            </>
          )}
        </div>
      </nav>

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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App
