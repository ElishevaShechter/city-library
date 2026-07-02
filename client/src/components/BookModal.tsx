import { useEffect } from 'react'
import type { Book, Category } from '../types'

interface Props {
  book: Book
  onClose: () => void
  activeLoanId?: string
  onBorrow?: () => void
  onReturn?: (loanId: string) => void
  borrowing?: boolean
  returning?: boolean
}

const BookModal = ({ book, onClose, activeLoanId, onBorrow, onReturn, borrowing, returning }: Props) => {
  const categoryName = typeof book.category === 'object' ? (book.category as Category).name : ''
  const isAvailable = book.availableCopies > 0

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const showBorrow = !activeLoanId && isAvailable && onBorrow
  const showReturn = !!activeLoanId && onReturn

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
          {book.totalCopies > 0 && (
            <div className="modal-row">
              <span className="modal-label">עותקים</span>
              <span>{book.availableCopies} זמינים מתוך {book.totalCopies}</span>
            </div>
          )}
          <div className="modal-row">
            <span className="modal-label">סטטוס</span>
            {activeLoanId ? (
              <span className="availability-badge borrowed">מושאל אצלך</span>
            ) : (
              <span className={`availability-badge ${isAvailable ? 'available' : 'borrowed'}`}>
                {isAvailable ? 'זמין להשאלה' : 'לא זמין כעת'}
              </span>
            )}
          </div>
        </div>

        {book.description && (
          <p className="modal-description">{book.description}</p>
        )}

        {(showBorrow || showReturn) && (
          <div className="modal-actions">
            {showBorrow && (
              <button
                className="modal-btn modal-btn-borrow"
                disabled={!!borrowing}
                onClick={onBorrow}
              >
                {borrowing ? 'מעבד...' : 'השאל'}
              </button>
            )}
            {showReturn && (
              <button
                className="modal-btn modal-btn-return"
                disabled={!!returning}
                onClick={() => onReturn!(activeLoanId)}
              >
                {returning ? 'מעבד...' : 'החזר ספר'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookModal
