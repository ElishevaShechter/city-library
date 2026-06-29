import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch'
import { loginUser, clearAuthError } from '../store/authSlice'
import './auth.css'

interface FormErrors {
  email?: string
  password?: string
}

const validate = (email: string, password: string): FormErrors => {
  const errors: FormErrors = {}
  if (!email.trim()) {
    errors.email = 'שדה חובה'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'כתובת אימייל לא תקינה'
  }
  if (!password) {
    errors.password = 'שדה חובה'
  }
  return errors
}

const LoginPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector(s => s.auth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    dispatch(clearAuthError())

    const errors = validate(email, password)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    const result = await dispatch(loginUser({ email: email.trim(), password }))
    if (loginUser.fulfilled.match(result)) {
      navigate('/')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">כניסה למערכת</h1>
        <p className="auth-subtitle">ספריית העיר — ברוכים הבאים</p>

        {error && (
          <div className="server-error" role="alert">
            {error}
            {error.includes('שגויים') && (
              <div className="reset-hint">
                <Link to="/forgot-password">שכחת סיסמה?</Link>
              </div>
            )}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">אימייל</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={fieldErrors.email ? 'error-input' : ''}
              placeholder="your@email.com"
              autoComplete="email"
              dir="ltr"
            />
            {fieldErrors.email && (
              <span className="field-error" role="alert">{fieldErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">סיסמה</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={fieldErrors.password ? 'error-input' : ''}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <span className="field-error" role="alert">{fieldErrors.password}</span>
            )}
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>

        <div className="auth-footer">
          אין לך חשבון עדיין?{' '}
          <Link to="/signup">הרשמה</Link>
        </div>
        <div className="auth-footer" style={{ marginTop: '0.5rem' }}>
          <Link to="/forgot-password">שכחת סיסמה?</Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
