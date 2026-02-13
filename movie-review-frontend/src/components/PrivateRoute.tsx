import React from 'react'
import { Navigate } from 'react-router-dom'

const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  const user = window.localStorage.getItem('user')
  const token = window.localStorage.getItem('token')
  return !!(user && token)
}

const getUserRole = (): string | null => {
  if (typeof window === 'undefined') return null
  const user = window.localStorage.getItem('user')
  if (!user) return null
  try {
    const parsed = JSON.parse(user)
    return parsed.role || null
  } catch {
    return null
  }
}

interface PrivateRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
  const authenticated = isAuthenticated()
  const userRole = getUserRole()

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default PrivateRoute
