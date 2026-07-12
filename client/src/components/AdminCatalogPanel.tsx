import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch'
import { fetchBooks, createBook, updateBook, deleteBook, clearCatalogError } from '../store/booksSlice'
import { fetchCategories } from '../store/categoriesSlice'
import BookFormModal from './BookFormModal'
import type { Book, Category } from '../types'

const AdminCatalogPanel = () => {
  const dispatch = useAppDispatch()
  const { books, loading, catalogSaving, catalogError, catalogDeletingId } = useAppSelector(s => s.books)
  const { categories } = useAppSelector(s => s.categories)

  const [query, setQuery] = useState('')
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchBooks())
    dispatch(fetchCategories())
  }, [dispatch])

  const openAddForm = () => {
    dispatch(clearCatalogError())
    setEditingBook(null)
    setFormOpen(true)
  }

  const openEditForm = (book: Book) => {
    dispatch(clearCatalogError())
    setEditingBook(book)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingBook(null)
  }

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (editingBook) {
      const result = await dispatch(updateBook({ id: editingBook._id, data }))
      if (updateBook.fulfilled.match(result)) {
        setSuccessMsg(`"${result.payload.title}" עודכן בהצלחה`)
        closeForm()
      }
    } else {
      const result = await dispatch(createBook(data as Parameters<typeof createBook>[0]))
      if (createBook.fulfilled.match(result)) {
        const isMerge = books.some(b => b._id === result.payload._id)
        setSuccessMsg(isMerge
          ? `ISBN קיים בקטלוג — נוספו עותקים ל"${result.payload.title}" (סה"כ ${result.payload.totalCopies})`
          : `"${result.payload.title}" נוסף לקטלוג בהצלחה`)
        closeForm()
      }
    }
  }

  const handleDelete = async (book: Book) => {
    const confirmed = window.confirm(`למחוק את "${book.title}"? פעולה זו אינה הפיכה.`)
    if (!confirmed) return
    const result = await dispatch(deleteBook(book._id))
    if (deleteBook.fulfilled.match(result)) {
      setSuccessMsg(`"${book.title}" נמחק מהקטלוג`)
    }
  }

  const categoryName = (category: Book['category']) =>
    typeof category === 'string'
      ? categories.find((c: Category) => c._id === category)?.name ?? ''
      : category.name

  const filtered = books.filter(book => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      (book.isbn ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="catalog-panel">
      {catalogError && (
        <div className="personal-notification error">
          <span>{catalogError}</span>
          <button onClick={() => dispatch(clearCatalogError())}>✕</button>
        </div>
      )}
      {successMsg && (
        <div className="personal-notification success">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}>✕</button>
        </div>
      )}

      <div className="catalog-toolbar">
        <input
          type="text"
          className="search-input catalog-search"
          placeholder="חיפוש לפי כותרת, מחבר או ISBN..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className="catalog-add-btn" onClick={openAddForm}>+ הוספת ספר</button>
      </div>

      {loading ? (
        <p className="loans-loading">טוען קטלוג...</p>
      ) : filtered.length === 0 ? (
        <div className="loans-empty">
          <p>לא נמצאו ספרים</p>
        </div>
      ) : (
        <div className="loans-table-wrap">
          <table className="loans-table">
            <thead>
              <tr>
                <th>ספר</th>
                <th>ISBN</th>
                <th>קטגוריה</th>
                <th>עותקים</th>
                <th>פעולה</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(book => (
                <tr key={book._id}>
                  <td>
                    <div className="loan-book-title">{book.title}</div>
                    <div className="loan-book-author">{book.author}</div>
                  </td>
                  <td>{book.isbn ?? '—'}</td>
                  <td>{categoryName(book.category) || '—'}</td>
                  <td>{book.availableCopies} / {book.totalCopies}</td>
                  <td>
                    <div className="loan-actions">
                      <button className="extend-btn" onClick={() => openEditForm(book)}>עריכה</button>
                      <button
                        className="catalog-delete-btn"
                        disabled={catalogDeletingId === book._id}
                        onClick={() => handleDelete(book)}
                      >
                        {catalogDeletingId === book._id ? 'מוחק...' : 'מחיקה'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <BookFormModal
          book={editingBook}
          categories={categories}
          saving={catalogSaving}
          serverError={catalogError}
          onClose={closeForm}
          onSubmit={handleSubmit}
          onClearServerError={() => dispatch(clearCatalogError())}
        />
      )}
    </div>
  )
}

export default AdminCatalogPanel
