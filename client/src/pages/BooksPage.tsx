import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch'
import { fetchBooks } from '../store/booksSlice'
import BookCard from '../components/BookCard'
import BookModal from '../components/BookModal'
import type { Book, Category } from '../types'
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
  const [query, setQuery]       = useState('')
  const [searchBy, setSearchBy] = useState<SearchBy>('all')
  const [selected, setSelected] = useState<Book | null>(null)

  useEffect(() => {
    dispatch(fetchBooks())
  }, [dispatch])

  // כל ה-hooks מעל — early returns מתחת
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (loading) return <div className="books-page"><p className="results-count">טוען ספרים...</p></div>
  if (error)   return <div className="books-page"><p className="results-count">שגיאה: {error}</p></div>

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

  return (
    <main className="books-page">
      <h1 className="books-heading">קטלוג הספרים</h1>

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
              <BookCard key={book._id} book={book} onClick={setSelected} />
            ))}
          </div>
        </>
      )}

      {selected && <BookModal book={selected} onClose={() => setSelected(null)} />}
    </main>
  )
}

export default BooksPage
