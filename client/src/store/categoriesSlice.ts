import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { Category } from '../types'
import * as categoriesApi from '../api/categoriesApi'

interface CategoriesState {
  categories: Category[]
  loading: boolean
  error: string | null
}

const initialState: CategoriesState = {
  categories: [],
  loading: false,
  error: null,
}

export const fetchCategories = createAsyncThunk('categories/fetchAll', async () => {
  const res = await categoriesApi.getCategories()
  return res.data
})

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.loading = false; state.categories = action.payload })
      .addCase(fetchCategories.rejected, (state, action) => { state.loading = false; state.error = action.error.message ?? 'שגיאה בטעינת הקטגוריות' })
  },
})

export default categoriesSlice.reducer
