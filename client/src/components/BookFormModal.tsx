import { useState, useEffect, FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch'
import { fetchBookHistory, clearHistory } from '../store/booksSlice'
import type { Book, Category } from '../types'

interface FormErrors {
  title?: string
  author?: string
  isbn?: string
  publisher?: string
  publishedYear?: string
  category?: string
  totalCopies?: string
}

interface FormData {
  title: string
  author: string
  isbn: string
  publisher: string
  publishedYear: string
  category: string
  totalCopies: string
  description: string
  coverImage: string
}

interface Props {
  book: Book | null
  categories: Category[]
  saving: boolean
  serverError: string | null
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => void
  onClearServerError: () => void
}

const ACTION_LABELS: Record<string, string> = {
  created: 'נוצר',
  updated: 'עודכן',
  copies_added: 'נוספו עותקים',
  deleted: 'נמחק',
}

const FIELD_LABELS: Record<string, string> = {
  title: 'כותרת',
  author: 'מחבר',
  isbn: 'ISBN',
  publisher: 'הוצאה',
  publishedYear: 'שנת הוצאה',
  category: 'קטגוריה',
  description: 'תיאור',
  coverImage: 'תמונת כריכה',
  totalCopies: 'סה"כ עותקים',
  availableCopies: 'עותקים זמינים',
}

const fmt = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const emptyForm: FormData = {
  title: '', author: '', isbn: '', publisher: '', publishedYear: '', category: '', totalCopies: '1', description: '', coverImage: '',
}

const validate = (form: FormData): FormErrors => {
  const errors: FormErrors = {}
  if (!form.title.trim()) errors.title = 'שדה חובה'
  if (!form.author.trim()) errors.author = 'שדה חובה'
  if (!form.category) errors.category = 'שדה חובה'

  const cleanIsbn = form.isbn.replace(/[-\s]/g, '').toUpperCase()
  if (!cleanIsbn) {
    errors.isbn = 'שדה חובה'
  } else if (!/^\d{9}[\dX]$/.test(cleanIsbn) && !/^\d{13}$/.test(cleanIsbn)) {
    errors.isbn = 'פורמט ISBN לא תקין (10 או 13 ספרות)'
  }

  if (!form.publisher.trim()) errors.publisher = 'שדה חובה'

  if (!form.publishedYear.trim()) {
    errors.publishedYear = 'שדה חובה'
  } else if (!Number.isInteger(Number(form.publishedYear))) {
    errors.publishedYear = 'שנה לא תקינה'
  }

  const copies = Number(form.totalCopies)
  if (!form.totalCopies.trim() || !Number.isInteger(copies) || copies < 1) {
    errors.totalCopies = 'מספר עותקים חייב להיות מספר שלם חיובי'
  }

  return errors
}

const BookFormModal = ({ book, categories, saving, serverError, onClose, onSubmit, onClearServerError }: Props) => {
  const dispatch = useAppDispatch()
  const { history, historyLoading } = useAppSelector(s => s.books)
  const isEdit = !!book

  const [form, setForm] = useState<FormData>(() => book ? {
    title: book.title,
    author: book.author,
    isbn: book.isbn ?? '',
    publisher: book.publisher ?? '',
    publishedYear: book.publishedYear ? String(book.publishedYear) : '',
    category: typeof book.category === 'string' ? book.category : book.category._id,
    totalCopies: String(book.totalCopies),
    description: book.description ?? '',
    coverImage: book.coverImage ?? '',
  } : emptyForm)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (book) dispatch(fetchBookHistory(book._id))
    return () => { dispatch(clearHistory()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?._id])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onClearServerError()

    const errors = validate(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    onSubmit({
      title: form.title.trim(),
      author: form.author.trim(),
      isbn: form.isbn.trim(),
      publisher: form.publisher.trim(),
      publishedYear: Number(form.publishedYear),
      category: form.category,
      totalCopies: Number(form.totalCopies),
      description: form.description.trim() || undefined,
      coverImage: form.coverImage.trim() || undefined,
    })
  }

  const formatValue = (field: string, value: unknown): string => {
    if (field === 'category') {
      const cat = categories.find(c => c._id === value)
      return cat ? cat.name : String(value)
    }
    return String(value)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content catalog-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h2 className="modal-title">{isEdit ? 'עריכת ספר' : 'הוספת ספר חדש'}</h2>

        {serverError && (
          <div className="server-error" role="alert">{serverError}</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="catalog-form-row">
            <div className="form-group">
              <label htmlFor="title">כותרת</label>
              <input id="title" type="text" value={form.title} onChange={handleChange('title')}
                className={fieldErrors.title ? 'error-input' : ''} />
              {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="author">מחבר</label>
              <input id="author" type="text" value={form.author} onChange={handleChange('author')}
                className={fieldErrors.author ? 'error-input' : ''} />
              {fieldErrors.author && <span className="field-error">{fieldErrors.author}</span>}
            </div>
          </div>

          <div className="catalog-form-row">
            <div className="form-group">
              <label htmlFor="isbn">ISBN</label>
              <input id="isbn" type="text" value={form.isbn} onChange={handleChange('isbn')}
                className={fieldErrors.isbn ? 'error-input' : ''} dir="ltr" placeholder="0306406152" />
              {fieldErrors.isbn && <span className="field-error">{fieldErrors.isbn}</span>}
              {!isEdit && !fieldErrors.isbn && (
                <span className="field-hint">אם ה-ISBN כבר קיים בקטלוג, העותקים יתווספו לספר הקיים במקום ליצור רשומה כפולה</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="publisher">הוצאה</label>
              <input id="publisher" type="text" value={form.publisher} onChange={handleChange('publisher')}
                className={fieldErrors.publisher ? 'error-input' : ''} />
              {fieldErrors.publisher && <span className="field-error">{fieldErrors.publisher}</span>}
            </div>
          </div>

          <div className="catalog-form-row">
            <div className="form-group">
              <label htmlFor="category">קטגוריה</label>
              <select id="category" value={form.category} onChange={handleChange('category')}
                className={fieldErrors.category ? 'error-input' : ''}>
                <option value="">בחר קטגוריה</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {fieldErrors.category && <span className="field-error">{fieldErrors.category}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="publishedYear">שנת הוצאה</label>
              <input id="publishedYear" type="number" value={form.publishedYear} onChange={handleChange('publishedYear')}
                className={fieldErrors.publishedYear ? 'error-input' : ''} />
              {fieldErrors.publishedYear && <span className="field-error">{fieldErrors.publishedYear}</span>}
            </div>
          </div>

          <div className="catalog-form-row">
            <div className="form-group">
              <label htmlFor="totalCopies">{isEdit ? 'סה"כ עותקים' : 'מספר עותקים להוספה'}</label>
              <input id="totalCopies" type="number" min={1} value={form.totalCopies} onChange={handleChange('totalCopies')}
                className={fieldErrors.totalCopies ? 'error-input' : ''} />
              {fieldErrors.totalCopies && <span className="field-error">{fieldErrors.totalCopies}</span>}
              {isEdit && (
                <span className="field-hint">לא ניתן לרדת מתחת למספר העותקים המושאלים כרגע ({book!.totalCopies - book!.availableCopies})</span>
              )}
            </div>
            <div className="form-group">
              <label htmlFor="coverImage">קישור לתמונת כריכה (אופציונלי)</label>
              <input id="coverImage" type="text" value={form.coverImage} onChange={handleChange('coverImage')} dir="ltr" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">תיאור (אופציונלי)</label>
            <textarea id="description" value={form.description} onChange={handleChange('description')} rows={3} />
          </div>

          <button type="submit" className="btn-submit" disabled={saving}>
            {saving ? 'שומר...' : isEdit ? 'שמור שינויים' : 'הוסף ספר'}
          </button>
        </form>

        {isEdit && (
          <div className="catalog-history">
            <button type="button" className="catalog-history-toggle" onClick={() => setShowHistory(v => !v)}>
              {showHistory ? '▲ הסתר היסטוריית שינויים' : '▼ הצג היסטוריית שינויים'}
            </button>
            {showHistory && (
              historyLoading ? (
                <p className="catalog-history-loading">טוען היסטוריה...</p>
              ) : history.length === 0 ? (
                <p className="catalog-history-loading">אין היסטוריה עדיין</p>
              ) : (
                <ul className="catalog-history-list">
                  {history.map(entry => {
                    const performer = typeof entry.performedBy === 'string' ? entry.performedBy : entry.performedBy.name
                    return (
                      <li key={entry._id} className="catalog-history-item">
                        <div className="catalog-history-head">
                          <span className={`catalog-history-action ${entry.action}`}>{ACTION_LABELS[entry.action] ?? entry.action}</span>
                          <span className="catalog-history-meta">{performer} · {fmt(entry.createdAt)}</span>
                        </div>
                        {entry.changes.length > 0 && (
                          <ul className="catalog-history-changes">
                            {entry.changes.map((c, i) => (
                              <li key={i}>
                                <strong>{FIELD_LABELS[c.field] ?? c.field}:</strong>{' '}
                                מ-{formatValue(c.field, c.oldValue)} ל-{formatValue(c.field, c.newValue)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookFormModal
