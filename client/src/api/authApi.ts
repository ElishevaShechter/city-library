import api from './index'
import type { LoginCredentials, SignupData, AuthResponse } from '../types'

export const login = (credentials: LoginCredentials) =>
  api.post<AuthResponse>('/auth/login', credentials)

export const signup = (data: SignupData) =>
  api.post<AuthResponse>('/auth/signup', data)
