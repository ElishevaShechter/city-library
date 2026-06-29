import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Loan } from '../types'
import * as loansApi from '../api/loansApi'

interface LoansState {
  loans: Loan[]
  loading: boolean
  error: string | null
}

const initialState: LoansState = {
  loans: [],
  loading: false,
  error: null,
}

export const fetchMyLoans = createAsyncThunk('loans/fetchMy', async () => {
  const res = await loansApi.getMyLoans()
  return res.data
})

export const fetchAllLoans = createAsyncThunk('loans/fetchAll', async () => {
  const res = await loansApi.getAllLoans()
  return res.data
})

export const borrowBook = createAsyncThunk('loans/borrow', async (bookId: string) => {
  const res = await loansApi.createLoan(bookId)
  return res.data
})

export const returnBook = createAsyncThunk('loans/return', async (loanId: string) => {
  const res = await loansApi.returnLoan(loanId)
  return res.data
})

const loansSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyLoans.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchMyLoans.fulfilled, (state, action) => { state.loading = false; state.loans = action.payload })
      .addCase(fetchMyLoans.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'שגיאה' })
      .addCase(fetchAllLoans.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchAllLoans.fulfilled, (state, action) => { state.loading = false; state.loans = action.payload })
      .addCase(fetchAllLoans.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'שגיאה' })
      .addCase(borrowBook.pending, (state) => { state.loading = true; state.error = null })
      .addCase(borrowBook.fulfilled, (state, action) => { state.loading = false; state.loans.push(action.payload) })
      .addCase(borrowBook.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'שגיאה' })
      .addCase(returnBook.pending, (state) => { state.loading = true; state.error = null })
      .addCase(returnBook.fulfilled, (state, action) => {
        state.loading = false
        const idx = state.loans.findIndex(l => l._id === action.payload._id)
        if (idx !== -1) state.loans[idx] = action.payload
      })
      .addCase(returnBook.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'שגיאה' })
  },
})

export default loansSlice.reducer
