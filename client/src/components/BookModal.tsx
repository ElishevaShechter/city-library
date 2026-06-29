import { useEffect } from 'react'
import type { Book, Category } from '../types'

interface Props {
  book: Book
  onClose: () => void
}

const BookModal = ({ book, onClose }: Props) => {
  const categoryName = typeof book.category === 'object' ? (book.category as Category).name : ''
  const isAvailable = book.availableCopies > 0

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <h2 className="modal-title">{book.title}</h2>
        <p className="modal-author">מאת: {book.author}</p>

        <div className="modal-details">
          {categoryName && (
            <div className="modal-row">
              <span className="modal-label">קטגוריה</span>
              <span>{categoryName}</span>
            </div>
          )}
          {book.publishedYear && (
            <div className="modal-row">
              <span className="modal-label">שנת הוצאה</span>
              <span>{book.publishedYear}</span>
            </div>
          )}
          <div className="modal-row">
            <span className="modal-label">עותקים</span>
            <span>{book.availableCopies} זמינים מתוך {book.totalCopies}</span>
          </div>
          <div className="modal-row">
            <span className="modal-label">סטטוס</span>
            <span className={`availability-badge ${isAvailable ? 'available' : 'borrowed'}`}>
              {isAvailable ? 'זמין להשאלה' : 'לא זמין כעת'}
            </span>
          </div>
        </div>

        {book.description && (
          <p className="modal-description">{book.description}</p>
        )}
      </div>
    </div>
  )
}

export default BookModal
