import React from 'react'
import { Navigate } from 'react-router-dom'

// Minimal placeholder: replace with real auth logic
const isAuthenticated = () => false

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />
}

export default PrivateRoute
