import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import booksReducer from './booksSlice'
import categoriesReducer from './categoriesSlice'
import loansReducer from './loansSlice'
import membersReducer from './membersSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    books: booksReducer,
    categories: categoriesReducer,
    loans: loansReducer,
    members: membersReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
