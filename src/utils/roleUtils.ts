import { User } from '@/types/auth.types'

export const isTeacherOrOwner = (user?: User | null) =>
  !!user && (user.role === 'teacher' || user.role === 'owner')

export const isOwner = (user?: User | null) => !!user && user.role === 'owner'

export const canManageExam = (user?: User | null, examOwnerId?: string) =>
  isTeacherOrOwner(user) || (!!user && !!examOwnerId && user.id === examOwnerId)
