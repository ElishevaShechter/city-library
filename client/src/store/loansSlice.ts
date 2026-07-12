import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import type { Loan } from '../types'
import * as loansApi from '../api/loansApi'

interface LoansState {
  loans: Loan[]
  loading: boolean
  error: string | null
  borrowError: string | null
  extendError: string | null
  allLoans: Loan[]
  allLoansLoading: boolean
  allLoansError: string | null
}

const initialState: LoansState = {
  loans: [],
  loading: false,
  error: null,
  borrowError: null,
  extendError: null,
  allLoans: [],
  allLoansLoading: false,
  allLoansError: null,
}

export const fetchMyLoans = createAsyncThunk('loans/fetchMy', async () => {
  const res = await loansApi.getMyLoans()
  return res.data
})

export const fetchAllLoans = createAsyncThunk('loans/fetchAll', async () => {
  const res = await loansApi.getAllLoans()
  return res.data
})

export const borrowBook = createAsyncThunk(
  'loans/borrow',
  async (bookId: string, { rejectWithValue }) => {
    try {
      const res = await loansApi.createLoan(bookId)
      return res.data
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message
        if (msg === 'No available copies') return rejectWithValue('הספר אינו זמין כרגע')
        if (msg === 'You already have this book on loan') return rejectWithValue('הספר כבר מושאל אצלך')
        if (msg === 'Loan limit reached') return rejectWithValue('הגעת למגבלת ההשאלות המותרת — 5 ספרים')
        return rejectWithValue(msg ?? 'שגיאה בהשאלה')
      }
      return rejectWithValue('שגיאה בהשאלה')
    }
  }
)

export const returnBook = createAsyncThunk('loans/return', async (loanId: string) => {
  const res = await loansApi.returnLoan(loanId)
  return res.data
})

export const extendLoan = createAsyncThunk(
  'loans/extend',
  async (loanId: string, { rejectWithValue }) => {
    try {
      const res = await loansApi.extendLoan(loanId)
      return res.data
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message
        if (msg === 'Extension limit reached') return rejectWithValue('הגעת למגבלת ההארכות המותרת (2 הארכות) — יש להחזיר את הספר')
        if (msg === 'Book already returned') return rejectWithValue('ההשאלה כבר הוחזרה')
        if (msg === 'Not authorized') return rejectWithValue('אין הרשאה להאריך השאלה זו')
        if (msg === 'Loan not found') return rejectWithValue('ההשאלה לא נמצאה')
        return rejectWithValue(msg ?? 'שגיאה בהארכת ההשאלה')
      }
      return rejectWithValue('שגיאה בהארכת ההשאלה')
    }
  }
)

const loansSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {
    clearBorrowError(state) {
      state.borrowError = null
    },
    clearExtendError(state) {
      state.extendError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyLoans.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchMyLoans.fulfilled, (state, action) => { state.loading = false; state.loans = action.payload })
      .addCase(fetchMyLoans.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'שגיאה' })
      .addCase(fetchAllLoans.pending, (state) => { state.allLoansLoading = true; state.allLoansError = null })
      .addCase(fetchAllLoans.fulfilled, (state, action) => { state.allLoansLoading = false; state.allLoans = action.payload })
      .addCase(fetchAllLoans.rejected, (state, action) => { state.allLoansLoading = false; state.allLoansError = action.error.message ?? 'שגיאה' })
      .addCase(borrowBook.pending, (state) => { state.borrowError = null })
      .addCase(borrowBook.fulfilled, (state, action) => { state.loans.push(action.payload) })
      .addCase(borrowBook.rejected, (state, action) => { state.borrowError = action.payload as string })
      .addCase(returnBook.fulfilled, (state, action) => {
        const idx = state.loans.findIndex(l => l._id === action.payload._id)
        if (idx !== -1) state.loans[idx] = action.payload
        const allIdx = state.allLoans.findIndex(l => l._id === action.payload._id)
        if (allIdx !== -1) state.allLoans[allIdx] = action.payload
      })
      .addCase(extendLoan.pending, (state) => { state.extendError = null })
      .addCase(extendLoan.fulfilled, (state, action) => {
        const idx = state.loans.findIndex(l => l._id === action.payload._id)
        if (idx !== -1) state.loans[idx] = action.payload
        const allIdx = state.allLoans.findIndex(l => l._id === action.payload._id)
        if (allIdx !== -1) state.allLoans[allIdx] = action.payload
      })
      .addCase(extendLoan.rejected, (state, action) => { state.extendError = action.payload as string })
  },
})

export const { clearBorrowError, clearExtendError } = loansSlice.actions
export default loansSlice.reducer
