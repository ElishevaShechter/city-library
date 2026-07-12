import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch'
import { fetchBooks } from '../store/booksSlice'
import { borrowBook, returnBook, clearBorrowError } from '../store/loansSlice'
import BookCard from '../components/BookCard'
import BookModal from '../components/BookModal'
import type { Book, Category, Loan } from '../types'
import './BooksPage.css'

type SearchBy = 'all' | 'title' | 'author' | 'category'

const FILTERS: { value: SearchBy; label: string }[] = [
  { value: 'all',      label: 'הכל' },
  { value: 'title',    label: 'כותרת' },
  { value: 'author',   label: 'מחבר' },
  { value: 'category', label: 'קטגוריה' },
]

const BooksPage = () => {
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAppSelector(s => s.auth)
  const { books, loading, error } = useAppSelector(s => s.books)
  const { loans, borrowError } = useAppSelector(s => s.loans)

  const [query, setQuery]         = useState('')
  const [searchBy, setSearchBy]   = useState<SearchBy>('all')
  const [selected, setSelected]   = useState<Book | null>(null)
  const [borrowingId, setBorrowingId] = useState<string | null>(null)
  const [returningId, setReturningId] = useState<string | null>(null)
  const [successMsg, setSuccessMsg]   = useState<string | null>(null)

  useEffect(() => { dispatch(fetchBooks()) }, [dispatch])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (loading) return <div className="books-page"><p className="results-count">טוען ספרים...</p></div>
  if (error)   return <div className="books-page"><p className="results-count">שגיאה: {error}</p></div>

  const getActiveLoan = (bookId: string): Loan | undefined =>
    loans.find(l => {
      if (!l.book) return false
      const loanBookId = typeof l.book === 'string' ? l.book : l.book._id
      return loanBookId === bookId && l.status === 'active'
    })

  const handleBorrow = async (bookId: string) => {
    setBorrowingId(bookId)
    dispatch(clearBorrowError())
    setSuccessMsg(null)
    const result = await dispatch(borrowBook(bookId))
    setBorrowingId(null)
    if (borrowBook.fulfilled.match(result)) {
      const title = books.find(b => b._id === bookId)?.title ?? 'הספר'
      setSuccessMsg(`"${title}" הושאל בהצלחה! תאריך החזרה: ${new Date(result.payload.dueDate).toLocaleDateString('he-IL')}`)
      setSelected(null)
    }
  }

  const handleReturn = async (loanId: string) => {
    setReturningId(loanId)
    const result = await dispatch(returnBook(loanId))
    setReturningId(null)
    if (returnBook.fulfilled.match(result)) {
      const returnedBook = result.payload.book
      const bookId = !returnedBook ? null : typeof returnedBook === 'string' ? returnedBook : returnedBook._id
      const title = (bookId && books.find(b => b._id === bookId)?.title) ?? 'הספר'
      setSuccessMsg(`"${title}" הוחזר בהצלחה`)
      setSelected(null)
    }
  }

  const filtered = books.filter(book => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    const cat = typeof book.category === 'object' ? (book.category as Category).name : ''
    switch (searchBy) {
      case 'title':    return book.title.toLowerCase().includes(q)
      case 'author':   return book.author.toLowerCase().includes(q)
      case 'category': return cat.toLowerCase().includes(q)
      default:
        return (
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q) ||
          cat.toLowerCase().includes(q)
        )
    }
  })

  const selectedLoan = selected ? getActiveLoan(selected._id) : undefined

  return (
    <main className="books-page">
      <h1 className="books-heading">קטלוג הספרים</h1>

      {borrowError && (
        <div className="borrow-notification error">
          <span>{borrowError}</span>
          <button onClick={() => dispatch(clearBorrowError())}>✕</button>
        </div>
      )}
      {successMsg && (
        <div className="borrow-notification success">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}>✕</button>
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="חיפוש ספר..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <div className="filter-buttons">
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={`filter-btn ${searchBy === f.value ? 'active' : ''}`}
              onClick={() => setSearchBy(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="no-results">
          <p>לא נמצאו ספרים עבור "<strong>{query}</strong>"</p>
          <p className="no-results-hint">נסה לחפש לפי קריטריון אחר או שנה את מונח החיפוש</p>
        </div>
      ) : (
        <>
          <p className="results-count">{filtered.length} ספרים</p>
          <div className="books-grid">
            {filtered.map(book => (
              <BookCard
                key={book._id}
                book={book}
                onClick={setSelected}
                onBorrow={handleBorrow}
                borrowing={borrowingId === book._id}
              />
            ))}
          </div>
        </>
      )}

      {selected && (
        <BookModal
          book={selected}
          onClose={() => setSelected(null)}
          activeLoanId={selectedLoan?._id}
          onBorrow={() => handleBorrow(selected._id)}
          onReturn={handleReturn}
          borrowing={borrowingId === selected._id}
          returning={!!returningId && returningId === selectedLoan?._id}
        />
      )}
    </main>
  )
}

export default BooksPage
