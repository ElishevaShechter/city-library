import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch'
import { fetchAllLoans, returnBook, extendLoan, clearExtendError } from '../store/loansSlice'
import AdminCatalogPanel from '../components/AdminCatalogPanel'
import AdminMembersPanel from '../components/AdminMembersPanel'
import '../pages/PersonalAreaPage.css'
import './AdminPage.css'

const MAX_EXTENSIONS = 2

type Tab = 'loans' | 'catalog' | 'members'

const fmt = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })

const AdminPage = () => {
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector(s => s.auth)
  const { allLoans, allLoansLoading, extendError } = useAppSelector(s => s.loans)

  const [tab, setTab] = useState<Tab>('loans')
  const [returningId, setReturningId] = useState<string | null>(null)
  const [extendingId, setExtendingId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg]   = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') dispatch(fetchAllLoans())
  }, [dispatch, isAuthenticated, user?.role])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/" replace />

  const handleReturn = async (loanId: string) => {
    setReturningId(loanId)
    const result = await dispatch(returnBook(loanId))
    setReturningId(null)
    if (returnBook.fulfilled.match(result)) {
      setSuccessMsg('ההשאלה סומנה כהוחזרה')
    }
  }

  const handleExtend = async (loanId: string) => {
    setExtendingId(loanId)
    dispatch(clearExtendError())
    const result = await dispatch(extendLoan(loanId))
    setExtendingId(null)
    if (extendLoan.fulfilled.match(result)) {
      setSuccessMsg(`ההשאלה הוארכה עד ${fmt(result.payload.dueDate)}`)
    }
  }

  return (
    <main className="personal-page">
      <h1 className="personal-heading">ניהול הספרייה</h1>
      <p className="personal-welcome">ניהול השאלות, קטלוג הספרים וחברי הספרייה</p>

      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${tab === 'loans' ? 'active' : ''}`}
          onClick={() => setTab('loans')}
        >
          השאלות
        </button>
        <button
          className={`admin-tab-btn ${tab === 'catalog' ? 'active' : ''}`}
          onClick={() => setTab('catalog')}
        >
          קטלוג ספרים
        </button>
        <button
          className={`admin-tab-btn ${tab === 'members' ? 'active' : ''}`}
          onClick={() => setTab('members')}
        >
          ניהול חברים
        </button>
      </div>

      {tab === 'loans' ? (
        <>
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

          {allLoansLoading ? (
            <p className="loans-loading">טוען השאלות...</p>
          ) : allLoans.length === 0 ? (
            <div className="loans-empty">
              <p>אין השאלות במערכת</p>
            </div>
          ) : (
            <div className="loans-table-wrap">
              <table className="loans-table">
                <thead>
                  <tr>
                    <th>חבר</th>
                    <th>ספר</th>
                    <th>תאריך השאלה</th>
                    <th>תאריך החזרה צפוי</th>
                    <th>סטטוס</th>
                    <th>פעולה</th>
                  </tr>
                </thead>
                <tbody>
                  {allLoans.map(loan => {
                    const book = loan.book
                    const member = loan.user
                    const isActive = loan.status === 'active'
                    const memberName = !member ? 'משתמש לא קיים' : typeof member === 'string' ? member : member.name
                    const memberEmail = member && typeof member !== 'string' ? member.email : null
                    const bookTitle = !book ? 'ספר לא קיים' : typeof book === 'string' ? book : book.title
                    const bookAuthor = book && typeof book !== 'string' ? book.author : null
                    return (
                      <tr key={loan._id}>
                        <td>
                          <div className="loan-book-title">{memberName}</div>
                          {memberEmail && (
                            <div className="loan-book-author">{memberEmail}</div>
                          )}
                        </td>
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
                        <td>
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
        </>
      ) : tab === 'catalog' ? (
        <AdminCatalogPanel />
      ) : (
        <AdminMembersPanel />
      )}
    </main>
  )
}

export default AdminPage
