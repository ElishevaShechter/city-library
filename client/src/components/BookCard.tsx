import type { Book, Category } from '../types'

interface Props {
  book: Book
  onClick: (book: Book) => void
  onBorrow?: (bookId: string) => void
  borrowing?: boolean
}

const categoryGradients: Record<string, string> = {
  'פנטזיה':      'linear-gradient(145deg, #a594d4, #7a6eb0)',
  'מדע בדיוני':  'linear-gradient(145deg, #6aaec8, #4a8aaa)',
  'מתח':         'linear-gradient(145deg, #c98888, #a86060)',
  'היסטוריה':    'linear-gradient(145deg, #c9a876, #a88050)',
  'ילדים':       'linear-gradient(145deg, #7ec4a0, #52a078)',
  'רומן':        'linear-gradient(145deg, #c898b8, #a87090)',
}
const defaultGradient = 'linear-gradient(145deg, #94a8c4, #6a84a8)'

const BookCard = ({ book, onClick, onBorrow, borrowing }: Props) => {
  const categoryName = typeof book.category === 'object' ? (book.category as Category).name : ''
  const isAvailable = book.availableCopies > 0
  const gradient = categoryGradients[categoryName] ?? defaultGradient

  return (
    <div className="book-card" onClick={() => onClick(book)}>
      <div className="book-cover" style={{ background: gradient }}>
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
