import type { Book, Category } from '../types'

interface Props {
  book: Book
  onClick: (book: Book) => void
  onBorrow?: (bookId: string) => void
  borrowing?: boolean
}

const categoryColors: Record<string, string> = {
  'פנטזיה':      '#7c3aed',
  'מדע בדיוני':  '#0891b2',
  'מתח':         '#dc2626',
  'היסטוריה':    '#b45309',
  'ילדים':       '#16a34a',
  'רומן':        '#db2777',
}

const BookCard = ({ book, onClick, onBorrow, borrowing }: Props) => {
  const categoryName = typeof book.category === 'object' ? (book.category as Category).name : ''
  const isAvailable = book.availableCopies > 0
  const color = categoryColors[categoryName] ?? '#64748b'

  return (
    <div className="book-card" onClick={() => onClick(book)}>
      <div className="book-cover" style={{ backgroundColor: color }}>
        <span className="book-cover-text">{book.title}</span>
      </div>
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>
        <div className="book-meta">
          {book.publishedYear && <span>{book.publishedYear}</span>}
          {categoryName && <span className="book-category-tag">{categoryName}</span>}
        </div>
        <span className={`availability-badge ${isAvailable ? 'available' : 'borrowed'}`}>
          {isAvailable ? `זמין (${book.availableCopies})` : 'מושאל'}
        </span>
        <button
          className={`borrow-btn ${!isAvailable ? 'borrow-btn--unavailable' : ''}`}
          disabled={!isAvailable || borrowing}
          onClick={e => { e.stopPropagation(); onBorrow?.(book._id) }}
        >
          {borrowing ? 'מעבד...' : isAvailable ? 'השאל' : 'לא זמין'}
        </button>
      </div>
    </div>
  )
}

export default BookCard
