import { createContext, useContext, useState, useCallback } from 'react'
import { loginApi, registerApi } from '@/api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback(async (email, password) => {
    const { data } = await loginApi(email, password)
    const jwt = data.token || data.accessToken
    localStorage.setItem('token', jwt)
    const userObj = { email, name: data.name || email }
    localStorage.setItem('user', JSON.stringify(userObj))
    setToken(jwt)
    setUser(userObj)
  }, [])

  const register = useCallback(async (name, email, password) => {
    await registerApi(name, email, password)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated: !!token, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
