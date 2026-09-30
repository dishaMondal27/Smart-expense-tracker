import { createContext, useContext, useState } from 'react'
import { setAuthToken } from '../services/api'
import authService from '../services/authService'

const AuthContext = createContext({
  token: null,
  user: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  // Store JWT strictly in memory / React state (NOT in localStorage)
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  const login = async (email, password) => {
    const data = await authService.login({ email, password })
    // Store in React state & configure Axios in-memory Authorization header
    setToken(data.token)
    setUser({
      id: data.id,
      name: data.name,
      email: data.email,
    })
    setAuthToken(data.token)
    return data
  }

  const register = async (name, email, password, confirmPassword) => {
    const data = await authService.register({ name, email, password, confirmPassword })
    // Auto-login upon successful registration
    setToken(data.token)
    setUser({
      id: data.id,
      name: data.name,
      email: data.email,
    })
    setAuthToken(data.token)
    return data
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    setAuthToken(null)
  }

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
