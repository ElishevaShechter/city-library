import api from './index'
import type { Loan } from '../types'

export const createLoan = (bookId: string) =>
  api.post<Loan>('/loans', { bookId })

export const getMyLoans = () =>
  api.get<Loan[]>('/loans/my')

export const getAllLoans = () =>
  api.get<Loan[]>('/loans')

export const returnLoan = (loanId: string) =>
  api.patch<Loan>(`/loans/${loanId}/return`)
