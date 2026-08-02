import { createContext, useCallback, useState, type ReactNode } from 'react'
import { setAuthToken } from '../api/client'
import { login as apiLogin } from '../api/auth'
import type { UserRole } from '../types/api'

interface AuthState {
  token: string | null
  role: UserRole | null
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<UserRole>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, role: null })

  const login = useCallback(async (username: string, password: string) => {
    
    const result = await apiLogin(username, password)
    setAuthToken(result.access_token)
    setState({ token: result.access_token, role: result.role })
    return result.role
    
  }, [])

  const logout = useCallback(() => {
    setAuthToken(null)
    setState({ token: null, role: null })
  }, [])

  return <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>
}




