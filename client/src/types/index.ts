export interface User {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface Category {
  _id: string
  name: string
}

export interface Book {
  _id: string
  title: string
  author: string
  isbn?: string
  publisher?: string
  category: Category | string
  description?: string
  publishedYear?: number
  coverImage?: string
  totalCopies: number
  availableCopies: number
  createdAt: string
  updatedAt: string
}

export interface BookHistoryChange {
  field: string
  oldValue: unknown
  newValue: unknown
}

export interface BookHistoryEntry {
  _id: string
  book: string
  action: 'created' | 'updated' | 'copies_added' | 'deleted'
  changes: BookHistoryChange[]
  performedBy: { _id: string; name: string; email: string } | string
  createdAt: string
  updatedAt: string
}

export interface Loan {
  _id: string
  // null כאשר המשתמש/הספר המקושרים נמחקו מה-DB
  user: User | string | null
  book: Book | string | null
  loanDate: string
  dueDate: string
  returnDate: string | null
  status: 'active' | 'returned'
  extensionsCount: number
  createdAt: string
  updatedAt: string
}

export interface MemberSearchResult {
  _id: string
  name: string
  email: string
  memberNumber: number | null
  role: 'user' | 'admin'
  status: 'active' | 'inactive'
}

export interface MemberProfile extends MemberSearchResult {
  nationalId: string | null
}

export interface MemberDetail extends MemberProfile {
  currentLoans: Loan[]
  loanHistory: Loan[]
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  name: string
  email: string
  password: string
  adminCode?: string
}

// צורת התגובה בפועל מהשרת — מחזיר id ולא _id
export interface AuthUserRaw {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

export interface AuthResponse {
  token: string
  user: AuthUserRaw
}
