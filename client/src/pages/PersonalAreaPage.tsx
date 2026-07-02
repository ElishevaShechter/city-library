import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch'
import { fetchMyLoans, returnBook } from '../store/loansSlice'
import BookModal from '../components/BookModal'
import type { Book, Loan } from '../types'
import './PersonalAreaPage.css'

const fmt = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })

const PersonalAreaPage = () => {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector(s => s.auth)
  const { loans, loading } = useAppSelector(s => s.loans)

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [returningId, setReturningId]   = useState<string | null>(null)
  const [successMsg, setSuccessMsg]     = useState<string | null>(null)

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
      const title = typeof book === 'string' ? 'הספר' : (book as Book).title
      setSuccessMsg(`"${title}" הוחזר בהצלחה`)
      setSelectedLoan(null)
    }
  }

  const modalBook = selectedLoan
    ? (typeof selectedLoan.book === 'string'
        ? null
        : selectedLoan.book as Book)
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

      {successMsg && (
        <div className="personal-notification success">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}>✕</button>
        </div>
      )}

      <h2 className="loans-section-title">
        ההשאלות שלי
        {loans.length > 0 && <span className="loans-count-badge">{loans.length}</span>}
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
                <th>פעולה</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => {
                const book = loan.book as Book
                const isActive = loan.status === 'active'
                return (
                  <tr
                    key={loan._id}
                    className={isActive ? 'loan-row-clickable' : ''}
                    onClick={() => isActive && typeof loan.book !== 'string' && setSelectedLoan(loan)}
                  >
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
                        {isActive ? 'מושאל' : 'הוחזר'}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      {isActive && (
                        <button
                          className="return-btn"
                          disabled={returningId === loan._id}
                          onClick={() => handleReturn(loan._id)}
                        >
                          {returningId === loan._id ? 'מעבד...' : 'החזר'}
                        </button>
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
        />
      )}
    </main>
  )
}

export default PersonalAreaPage
