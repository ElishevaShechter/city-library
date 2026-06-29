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
  category: Category | string
  description?: string
  publishedYear?: number
  coverImage?: string
  totalCopies: number
  availableCopies: number
  createdAt: string
  updatedAt: string
}

export interface Loan {
  _id: string
  user: User | string
  book: Book | string
  loanDate: string
  dueDate: string
  returnDate: string | null
  status: 'active' | 'returned'
  createdAt: string
  updatedAt: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  name: string
  email: string
  password: string
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
