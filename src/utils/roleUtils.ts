import { User } from '@/types/auth.types'

export const isTeacherOrAdmin = (user?: User | null) =>
  !!user && (user.role === 'teacher' || user.role === 'admin')

export const canManageExam = (user?: User | null, examOwnerId?: string) =>
  isTeacherOrAdmin(user) || (!!user && !!examOwnerId && user.id === examOwnerId)
