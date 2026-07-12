import api from './index'
import type { MemberSearchResult, MemberDetail, MemberProfile } from '../types'

export const searchMembers = (search: string) =>
  api.get<MemberSearchResult[]>('/members', { params: { search } })

export const getMemberById = (id: string) =>
  api.get<MemberDetail>(`/members/${id}`)

export const updateMember = (id: string, data: { name?: string; email?: string; nationalId?: string }) =>
  api.patch<MemberProfile>(`/members/${id}`, data)
