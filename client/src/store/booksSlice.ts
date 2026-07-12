import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import type { Book, BookHistoryEntry } from '../types'
import * as booksApi from '../api/booksApi'
import { borrowBook, returnBook } from './loansSlice'

interface BooksState {
  books: Book[]
  selectedBook: Book | null
  loading: boolean
  error: string | null
  catalogSaving: boolean
  catalogError: string | null
  catalogDeletingId: string | null
  history: BookHistoryEntry[]
  historyLoading: boolean
}

const initialState: BooksState = {
  books: [],
  selectedBook: null,
  loading: false,
  error: null,
  catalogSaving: false,
  catalogError: null,
  catalogDeletingId: null,
  history: [],
  historyLoading: false,
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

export const createBook = createAsyncThunk(
  'books/create',
  async (data: Omit<Book, '_id' | 'availableCopies' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const res = await booksApi.createBook(data)
      return res.data
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.message ?? 'שגיאה בהוספת הספר')
      }
      return rejectWithValue('שגיאה בהוספת הספר')
    }
  }
)

export const updateBook = createAsyncThunk(
  'books/update',
  async ({ id, data }: { id: string; data: Partial<Book> }, { rejectWithValue }) => {
    try {
      const res = await booksApi.updateBook(id, data)
      return res.data
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.message ?? 'שגיאה בעדכון הספר')
      }
      return rejectWithValue('שגיאה בעדכון הספר')
    }
  }
)

export const deleteBook = createAsyncThunk(
  'books/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await booksApi.deleteBook(id)
      return id
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message
        if (msg === 'Cannot delete a book with copies currently on loan') {
          return rejectWithValue('לא ניתן למחוק ספר שיש לו עותקים מושאלים כרגע')
        }
        return rejectWithValue(msg ?? 'שגיאה במחיקת הספר')
      }
      return rejectWithValue('שגיאה במחיקת הספר')
    }
  }
)

export const fetchBookHistory = createAsyncThunk(
  'books/fetchHistory',
  async (id: string) => {
    const res = await booksApi.getBookHistory(id)
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
    clearCatalogError(state) {
      state.catalogError = null
    },
    clearHistory(state) {
      state.history = []
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
      .addCase(createBook.pending, (state) => { state.catalogSaving = true; state.catalogError = null })
      .addCase(createBook.fulfilled, (state, action) => {
        state.catalogSaving = false
        const idx = state.books.findIndex(b => b._id === action.payload._id)
        if (idx !== -1) state.books[idx] = action.payload
        else state.books.unshift(action.payload)
      })
      .addCase(createBook.rejected, (state, action) => { state.catalogSaving = false; state.catalogError = action.payload as string })
      .addCase(updateBook.pending, (state) => { state.catalogSaving = true; state.catalogError = null })
      .addCase(updateBook.fulfilled, (state, action) => {
        state.catalogSaving = false
        const idx = state.books.findIndex(b => b._id === action.payload._id)
        if (idx !== -1) state.books[idx] = action.payload
      })
      .addCase(updateBook.rejected, (state, action) => { state.catalogSaving = false; state.catalogError = action.payload as string })
      .addCase(deleteBook.pending, (state, action) => { state.catalogDeletingId = action.meta.arg; state.catalogError = null })
      .addCase(deleteBook.fulfilled, (state, action) => {
        state.catalogDeletingId = null
        state.books = state.books.filter(b => b._id !== action.payload)
      })
      .addCase(deleteBook.rejected, (state, action) => { state.catalogDeletingId = null; state.catalogError = action.payload as string })
      .addCase(fetchBookHistory.pending, (state) => { state.historyLoading = true })
      .addCase(fetchBookHistory.fulfilled, (state, action) => { state.historyLoading = false; state.history = action.payload })
      .addCase(fetchBookHistory.rejected, (state) => { state.historyLoading = false })
      .addCase(borrowBook.fulfilled, (state, action) => {
        if (!action.payload.book) return
        const bookId = typeof action.payload.book === 'string'
          ? action.payload.book
          : action.payload.book._id
        const book = state.books.find(b => b._id === bookId)
        if (book) book.availableCopies -= 1
      })
      .addCase(returnBook.fulfilled, (state, action) => {
        if (!action.payload.book) return
        const bookId = typeof action.payload.book === 'string'
          ? action.payload.book
          : action.payload.book._id
        const book = state.books.find(b => b._id === bookId)
        if (book) book.availableCopies += 1
      })
  },
})

export const { clearSelectedBook, clearCatalogError, clearHistory } = booksSlice.actions
export default booksSlice.reducer
