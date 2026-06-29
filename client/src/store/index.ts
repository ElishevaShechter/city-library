import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import booksReducer from './booksSlice'
import categoriesReducer from './categoriesSlice'
import loansReducer from './loansSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    books: booksReducer,
    categories: categoriesReducer,
    loans: loansReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
