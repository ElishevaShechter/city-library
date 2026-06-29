import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Book } from '../types'
import * as booksApi from '../api/booksApi'

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
  },
})

export const { clearSelectedBook } = booksSlice.actions
export default booksSlice.reducer
