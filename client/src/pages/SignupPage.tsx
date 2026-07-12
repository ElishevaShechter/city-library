import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch'
import { signupUser, clearAuthError } from '../store/authSlice'
import './auth.css'

interface FormErrors {
  name?: string
  email?: string
  password?: string
}

const validate = (name: string, email: string, password: string): FormErrors => {
  const errors: FormErrors = {}
  if (!name.trim()) {
    errors.name = 'שדה חובה'
  } else if (name.trim().length < 2) {
    errors.name = 'שם חייב להכיל לפחות 2 תווים'
  }
  if (!email.trim()) {
    errors.email = 'שדה חובה'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'כתובת אימייל לא תקינה'
  }
  if (!password) {
    errors.password = 'שדה חובה'
  } else if (password.length < 6) {
    errors.password = 'סיסמה חייבת להכיל לפחות 6 תווים'
  }
  return errors
}

const SignupPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, error } = useAppSelector(s => s.auth)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    dispatch(clearAuthError())

    const errors = validate(name, email, password)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    const result = await dispatch(signupUser({
      name: name.trim(),
      email: email.trim(),
      password,
      adminCode: adminCode.trim() || undefined,
    }))
    if (signupUser.fulfilled.match(result)) {
      navigate(result.payload.user.role === 'admin' ? '/admin' : '/')
    }
  }

  const isEmailTaken = error?.includes('כבר רשום')

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">הרשמה</h1>
        <p className="auth-subtitle">צור חשבון חדש בספריית העיר</p>

        {error && (
          <div className="server-error" role="alert">
            {isEmailTaken ? (
              <>
                האימייל כבר רשום במערכת.{' '}
                <Link to="/login">רוצה להתחבר?</Link>
              </>
            ) : (
              error
            )}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="name">שם מלא</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={fieldErrors.name ? 'error-input' : ''}
              placeholder="ישראל ישראלי"
              autoComplete="name"
            />
            {fieldErrors.name && (
              <span className="field-error" role="alert">{fieldErrors.name}</span>
            )}
          </div>

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
              placeholder="לפחות 6 תווים"
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <span className="field-error" role="alert">{fieldErrors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="adminCode">קוד מנהל (אופציונלי)</label>
            <input
              id="adminCode"
              type="password"
              value={adminCode}
              onChange={e => setAdminCode(e.target.value)}
              placeholder="להרשמה כחבר רגיל השאירו ריק"
              autoComplete="off"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'יוצר חשבון...' : 'הרשמה'}
          </button>
        </form>

        <div className="auth-footer">
          כבר יש לך חשבון?{' '}
          <Link to="/login">כניסה</Link>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
