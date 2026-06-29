import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import './auth.css'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setEmailError('שדה חובה')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('כתובת אימייל לא תקינה')
      return
    }
    setEmailError('')
    setSubmitted(true)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">איפוס סיסמה</h1>

        {submitted ? (
          <>
            <p className="auth-subtitle">
              אם הכתובת <strong>{email}</strong> רשומה במערכת, ישלח אליה מייל עם הוראות לאיפוס הסיסמה.
            </p>
            <div className="auth-footer" style={{ marginTop: '2rem' }}>
              <Link to="/login">חזרה לכניסה</Link>
            </div>
          </>
        ) : (
          <>
            <p className="auth-subtitle">הכנס/י את כתובת האימייל שלך ונשלח הוראות לאיפוס</p>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email">אימייל</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={emailError ? 'error-input' : ''}
                  placeholder="your@email.com"
                  autoComplete="email"
                  dir="ltr"
                />
                {emailError && (
                  <span className="field-error" role="alert">{emailError}</span>
                )}
              </div>

              <button type="submit" className="btn-submit">
                שליחת הוראות איפוס
              </button>
            </form>

            <div className="auth-footer">
              <Link to="/login">חזרה לכניסה</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
