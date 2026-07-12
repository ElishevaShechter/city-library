import api from './index'
import type { Book, BookHistoryEntry } from '../types'

export const getBooks = (params?: { search?: string; category?: string }) =>
  api.get<Book[]>('/books', { params })

export const getBookById = (id: string) =>
  api.get<Book>(`/books/${id}`)

export const createBook = (data: Omit<Book, '_id' | 'availableCopies' | 'createdAt' | 'updatedAt'>) =>
  api.post<Book>('/books', data)

export const updateBook = (id: string, data: Partial<Book>) =>
  api.patch<Book>(`/books/${id}`, data)

export const deleteBook = (id: string) =>
  api.delete(`/books/${id}`)

export const getBookHistory = (id: string) =>
  api.get<BookHistoryEntry[]>(`/books/${id}/history`)
