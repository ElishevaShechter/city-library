import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import type { User, LoginCredentials, SignupData, AuthUserRaw } from '../types'
import * as authApi from '../api/authApi'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
}

// Server returns { id, name, email, role } — normalize to User shape ({ _id, ... })
const normalizeUser = (raw: AuthUserRaw): User => ({
  _id: raw.id,
  name: raw.name,
  email: raw.email,
  role: raw.role,
  createdAt: '',
  updatedAt: '',
})

const persistAuth = (token: string, user: User) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const res = await authApi.login(credentials)
      return { token: res.data.token, user: normalizeUser(res.data.user) }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message
        if (msg === 'Invalid email or password') return rejectWithValue('האימייל או הסיסמה שגויים')
        return rejectWithValue(msg ?? 'שגיאה בהתחברות')
      }
      return rejectWithValue('שגיאה בהתחברות')
    }
  }
)

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (data: SignupData, { rejectWithValue }) => {
    try {
      const res = await authApi.signup(data)
      return { token: res.data.token, user: normalizeUser(res.data.user) }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message
        if (msg === 'Email already in use') return rejectWithValue('האימייל כבר רשום במערכת')
        return rejectWithValue(msg ?? 'שגיאה בהרשמה')
      }
      return rejectWithValue('שגיאה בהרשמה')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      persistAuth(action.payload.token, action.payload.user)
    },
    logout(state) {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        persistAuth(action.payload.token, action.payload.user)
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(signupUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        persistAuth(action.payload.token, action.payload.user)
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { setCredentials, logout, clearAuthError } = authSlice.actions
export default authSlice.reducer
