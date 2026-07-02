import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch'
import { logout } from '../store/authSlice'

const Navbar = () => {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector(s => s.auth)

  return (
    <nav>
      <Link to="/" className="nav-brand">ספריית העיר</Link>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/books">ספרים</Link>
            <Link to="/personal-area">אזור אישי</Link>
            <span className="nav-greeting">שלום, {user?.name}</span>
            <button className="nav-btn-logout" onClick={() => dispatch(logout())}>
              יציאה
            </button>
          </>
        ) : (
          <>
            <Link to="/books">ספרים</Link>
            <Link to="/login">כניסה</Link>
            <Link to="/signup">הרשמה</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
