import { createContext } from 'react'
import { AuthContextType } from '../../types/auth.types'

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthContextProvider = AuthContext.Provider

export { AuthContext }
