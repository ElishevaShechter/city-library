import { useEffect, useState, FormEvent } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch'
import { fetchMyLoans, returnBook, extendLoan, clearExtendError } from '../store/loansSlice'
import { fetchBooks } from '../store/booksSlice'
import { promoteToAdmin, clearPromoteError } from '../store/authSlice'
import BookModal from '../components/BookModal'
import api from '../api'
import type { Book, Loan } from '../types'
import './PersonalAreaPage.css'

const MAX_EXTENSIONS = 2

const fmt = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })

const PersonalAreaPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user, promoting, promoteError } = useAppSelector(s => s.auth)
  const { loans, loading, extendError } = useAppSelector(s => s.loans)

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [returningId, setReturningId]   = useState<string | null>(null)
  const [extendingId, setExtendingId]   = useState<string | null>(null)
  const [successMsg, setSuccessMsg]     = useState<string | null>(null)
  const [resetting, setResetting]       = useState(false)
  const [adminCode, setAdminCode]       = useState('')

  useEffect(() => {
    if (isAuthenticated) dispatch(fetchMyLoans())
  }, [dispatch, isAuthenticated])

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const activeCount = loans.filter(l => l.status === 'active').length

  const handleReturn = async (loanId: string) => {
    setReturningId(loanId)
    const result = await dispatch(returnBook(loanId))
    setReturningId(null)
    if (returnBook.fulfilled.match(result)) {
      const book = result.payload.book
      const title = !book ? 'הספר' : typeof book === 'string' ? 'הספר' : book.title
      setSuccessMsg(`"${title}" הוחזר בהצלחה`)
      setSelectedLoan(null)
    }
  }

  const handleExtend = async (loanId: string) => {
    setExtendingId(loanId)
    dispatch(clearExtendError())
    const result = await dispatch(extendLoan(loanId))
    setExtendingId(null)
    if (extendLoan.fulfilled.match(result)) {
      const book = result.payload.book
      const title = !book ? 'הספר' : typeof book === 'string' ? 'הספר' : book.title
      setSuccessMsg(`ההשאלה של "${title}" הוארכה עד ${fmt(result.payload.dueDate)}`)
    }
  }

  const handlePromote = async (e: FormEvent) => {
    e.preventDefault()
    const result = await dispatch(promoteToAdmin(adminCode.trim()))
    if (promoteToAdmin.fulfilled.match(result)) {
      navigate('/admin')
    }
  }

  const handleResetAll = async () => {
    setResetting(true)
    try {
      await api.post('/books/reset-availability')
      await dispatch(fetchMyLoans())
      await dispatch(fetchBooks())
      setSuccessMsg('כל הספרים אופסו לזמינות מלאה')
    } finally {
      setResetting(false)
    }
  }

  const openLoanModal = (loan: Loan) => {
    if (loan.status !== 'active') return
    if (!loan.book || typeof loan.book === 'string') return
    setSelectedLoan(loan)
  }

  const modalBook = selectedLoan && typeof selectedLoan.book !== 'string'
    ? selectedLoan.book as Book
    : null

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

      {user?.role !== 'admin' && (
        <form className="promote-card" onSubmit={handlePromote}>
          <div className="promote-info">
            <span className="promote-title">כניסה כמנהל</span>
            <span className="promote-hint">הזן/י קוד מנהל כדי לשדרג את החשבון ולעבור לניהול</span>
          </div>
          <div className="promote-controls">
            <input
              type="password"
              value={adminCode}
              onChange={e => setAdminCode(e.target.value)}
              placeholder="קוד מנהל"
              className="promote-input"
              autoComplete="off"
            />
            <button type="submit" className="promote-btn" disabled={promoting || !adminCode.trim()}>
              {promoting ? 'בודק...' : 'אישור'}
            </button>
          </div>
          {promoteError && (
            <div className="promote-error" role="alert">
              {promoteError}
              <button type="button" onClick={() => dispatch(clearPromoteError())}>✕</button>
            </div>
          )}
        </form>
      )}

      {extendError && (
        <div className="personal-notification error">
          <span>{extendError}</span>
          <button onClick={() => dispatch(clearExtendError())}>✕</button>
        </div>
      )}
      {successMsg && (
        <div className="personal-notification success">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}>✕</button>
        </div>
      )}

      <div className="loans-section-header">
        <h2 className="loans-section-title">
          ההשאלות שלי
          {loans.length > 0 && <span className="loans-count-badge">{loans.length}</span>}
        </h2>
        {user?.role === 'admin' && (
          <button
            className="reset-btn"
            disabled={resetting}
            onClick={handleResetAll}
          >
            {resetting ? 'מאפס...' : 'אפס זמינות ספרים'}
          </button>
        )}
      </div>

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
                <th>פעולה</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => {
                const book = loan.book
                const isActive = loan.status === 'active'
                const bookTitle = !book ? 'ספר לא קיים' : typeof book === 'string' ? book : book.title
                const bookAuthor = book && typeof book !== 'string' ? book.author : null
                return (
                  <tr
                    key={loan._id}
                    className={isActive ? 'loan-row-clickable' : ''}
                    onClick={isActive ? () => openLoanModal(loan) : undefined}
                  >
                    <td>
                      <div className="loan-book-title">{bookTitle}</div>
                      {bookAuthor && (
                        <div className="loan-book-author">{bookAuthor}</div>
                      )}
                    </td>
                    <td>{fmt(loan.loanDate)}</td>
                    <td>{fmt(loan.dueDate)}</td>
                    <td>
                      <span className={`loan-status ${loan.status}`}>
                        {isActive ? 'מושאל' : 'הוחזר'}
                      </span>
                      {isActive && loan.extensionsCount > 0 && (
                        <div className="loan-extensions-hint">הוארך {loan.extensionsCount}/{MAX_EXTENSIONS}</div>
                      )}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      {isActive && (
                        <div className="loan-actions">
                          {loan.extensionsCount < MAX_EXTENSIONS ? (
                            <button
                              className="extend-btn"
                              disabled={extendingId === loan._id}
                              onClick={() => handleExtend(loan._id)}
                            >
                              {extendingId === loan._id ? 'מעבד...' : 'הארך'}
                            </button>
                          ) : (
                            <span className="extend-limit-hint">מיצה הארכות</span>
                          )}
                          <button
                            className="return-btn"
                            disabled={returningId === loan._id}
                            onClick={() => handleReturn(loan._id)}
                          >
                            {returningId === loan._id ? 'מעבד...' : 'החזר'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedLoan && modalBook && (
        <BookModal
          book={modalBook}
          onClose={() => setSelectedLoan(null)}
          activeLoanId={selectedLoan._id}
          onReturn={handleReturn}
          returning={returningId === selectedLoan._id}
          onExtend={handleExtend}
          extending={extendingId === selectedLoan._id}
          extensionsCount={selectedLoan.extensionsCount}
        />
      )}
    </main>
  )
}

export default PersonalAreaPage
