import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import type { MemberSearchResult, MemberDetail } from '../types'
import * as membersApi from '../api/membersApi'

interface MembersState {
  results: MemberSearchResult[]
  searchLoading: boolean
  searchError: string | null
  selectedMember: MemberDetail | null
  detailLoading: boolean
  detailError: string | null
  saving: boolean
  saveError: string | null
}

const initialState: MembersState = {
  results: [],
  searchLoading: false,
  searchError: null,
  selectedMember: null,
  detailLoading: false,
  detailError: null,
  saving: false,
  saveError: null,
}

export const searchMembers = createAsyncThunk(
  'members/search',
  async (search: string) => {
    const res = await membersApi.searchMembers(search)
    return res.data
  }
)

export const fetchMemberById = createAsyncThunk(
  'members/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await membersApi.getMemberById(id)
      return res.data
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message
        if (msg === 'Member not found') return rejectWithValue('החבר לא נמצא')
        return rejectWithValue(msg ?? 'שגיאה בטעינת פרטי החבר')
      }
      return rejectWithValue('שגיאה בטעינת פרטי החבר')
    }
  }
)

export const updateMember = createAsyncThunk(
  'members/update',
  async ({ id, data }: { id: string; data: { name?: string; email?: string; nationalId?: string } }, { rejectWithValue }) => {
    try {
      const res = await membersApi.updateMember(id, data)
      return res.data
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message
        if (msg === 'Invalid email format') return rejectWithValue('פורמט אימייל לא תקין')
        if (msg === 'Email already in use') return rejectWithValue('האימייל כבר בשימוש על ידי חבר אחר')
        if (msg === 'Invalid national ID') return rejectWithValue('תעודת זהות לא תקינה')
        if (msg === 'National ID already belongs to another member') return rejectWithValue('תעודת הזהות כבר שייכת לחבר אחר')
        if (msg === 'Name is required') return rejectWithValue('שם הוא שדה חובה')
        return rejectWithValue(msg ?? 'שגיאה בעדכון פרטי החבר')
      }
      return rejectWithValue('שגיאה בעדכון פרטי החבר')
    }
  }
)

const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    clearSelectedMember(state) {
      state.selectedMember = null
      state.detailError = null
      state.saveError = null
    },
    clearSaveError(state) {
      state.saveError = null
    },
    clearSearchResults(state) {
      state.results = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchMembers.pending, (state) => { state.searchLoading = true; state.searchError = null })
      .addCase(searchMembers.fulfilled, (state, action) => { state.searchLoading = false; state.results = action.payload })
      .addCase(searchMembers.rejected, (state, action) => { state.searchLoading = false; state.searchError = action.error.message ?? 'שגיאה בחיפוש חברים' })
      .addCase(fetchMemberById.pending, (state) => { state.detailLoading = true; state.detailError = null })
      .addCase(fetchMemberById.fulfilled, (state, action) => { state.detailLoading = false; state.selectedMember = action.payload })
      .addCase(fetchMemberById.rejected, (state, action) => { state.detailLoading = false; state.detailError = action.payload as string })
      .addCase(updateMember.pending, (state) => { state.saving = true; state.saveError = null })
      .addCase(updateMember.fulfilled, (state, action) => {
        state.saving = false
        if (state.selectedMember && state.selectedMember._id === action.payload._id) {
          state.selectedMember = { ...state.selectedMember, ...action.payload }
        }
        const idx = state.results.findIndex(m => m._id === action.payload._id)
        if (idx !== -1) state.results[idx] = { ...state.results[idx], ...action.payload }
      })
      .addCase(updateMember.rejected, (state, action) => { state.saving = false; state.saveError = action.payload as string })
  },
})

export const { clearSelectedMember, clearSaveError, clearSearchResults } = membersSlice.actions
export default membersSlice.reducer
