import { useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch'
import { fetchMyLoans } from '../store/loansSlice'
import type { Book } from '../types'
import './PersonalAreaPage.css'

const fmt = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })

const PersonalAreaPage = () => {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector(s => s.auth)
  const { loans, loading } = useAppSelector(s => s.loans)

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchMyLoans())
  }, [dispatch, isAuthenticated])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const activeCount = loans.filter(l => l.status === 'active').length

  return (
    <main className="personal-page">
      <h1 className="personal-heading">אזור אישי</h1>
      <p className="personal-welcome">שלום, {user?.name}</p>

      <div className="personal-info-card">
        <div className="personal-info-item">
          <span className="personal-info-label">אימייל</span>
          <span className="personal-info-value">{user?.email}</span>
        </div>
        <div className="personal-info-item">
          <span className="personal-info-label">תפקיד</span>
          <span className="personal-info-value">{user?.role === 'admin' ? 'מנהל' : 'חבר'}</span>
        </div>
        <div className="personal-info-item">
          <span className="personal-info-label">ספרים מושאלים כעת</span>
          <span className="personal-info-value">{activeCount} / 5</span>
        </div>
      </div>

      <h2 className="loans-section-title">
        ההשאלות שלי
        {loans.length > 0 && (
          <span className="loans-count-badge">{loans.length}</span>
        )}
      </h2>

      {loading ? (
        <p className="loans-loading">טוען השאלות...</p>
      ) : loans.length === 0 ? (
        <div className="loans-empty">
          <p>טרם השאלת ספרים</p>
          <p className="loans-empty-hint">
            עבור ל<Link to="/books">קטלוג הספרים</Link> ובחר ספר להשאלה
          </p>
        </div>
      ) : (
        <div className="loans-table-wrap">
          <table className="loans-table">
            <thead>
              <tr>
                <th>ספר</th>
                <th>תאריך השאלה</th>
                <th>תאריך החזרה צפוי</th>
                <th>סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => {
                const book = loan.book as Book
                return (
                  <tr key={loan._id}>
                    <td>
                      <div className="loan-book-title">
                        {typeof book === 'string' ? book : book.title}
                      </div>
                      {typeof book !== 'string' && book.author && (
                        <div className="loan-book-author">{book.author}</div>
                      )}
                    </td>
                    <td>{fmt(loan.loanDate)}</td>
                    <td>{fmt(loan.dueDate)}</td>
                    <td>
                      <span className={`loan-status ${loan.status}`}>
                        {loan.status === 'active' ? 'מושאל' : 'הוחזר'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

export default PersonalAreaPage
