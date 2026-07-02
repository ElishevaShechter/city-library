import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Book } from '../types'
import * as booksApi from '../api/booksApi'
import { borrowBook } from './loansSlice'

interface BooksState {
  books: Book[]
  selectedBook: Book | null
  loading: boolean
  error: string | null
}

const initialState: BooksState = {
  books: [],
  selectedBook: null,
  loading: false,
  error: null,
}

export const fetchBooks = createAsyncThunk(
  'books/fetchAll',
  async (params?: { search?: string; category?: string }) => {
    const res = await booksApi.getBooks(params)
    return res.data
  }
)

export const fetchBookById = createAsyncThunk(
  'books/fetchOne',
  async (id: string) => {
    const res = await booksApi.getBookById(id)
    return res.data
  }
)

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {
    clearSelectedBook(state) {
      state.selectedBook = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchBooks.fulfilled, (state, action) => { state.loading = false; state.books = action.payload })
      .addCase(fetchBooks.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'שגיאה בטעינת הספרים' })
      .addCase(fetchBookById.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchBookById.fulfilled, (state, action) => { state.loading = false; state.selectedBook = action.payload })
      .addCase(fetchBookById.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'שגיאה בטעינת הספר' })
      // מעדכן availableCopies מקומית ברגע שהשאלה מצליחה
      .addCase(borrowBook.fulfilled, (state, action) => {
        const bookId = typeof action.payload.book === 'string'
          ? action.payload.book
          : action.payload.book._id
        const book = state.books.find(b => b._id === bookId)
        if (book) book.availableCopies -= 1
      })
  },
})

export const { clearSelectedBook } = booksSlice.actions
export default booksSlice.reducer
