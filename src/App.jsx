import { createContext, useContext, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Board from './components/Board'
import CardDetail from './components/CardDetail'

// ─── Auth Context ──────────────────────────────────────────────────────────────
// This context makes the current user available anywhere in the component tree
// without having to pass it down through props manually.

export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

// ─── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  // Try to restore the logged-in user from a previous session
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kanban_auth')) || null
    } catch {
      return null
    }
  })

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('kanban_auth', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('kanban_auth')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <Routes>
          {/* /login → show login form (redirect to / if already logged in) */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login />}
          />

          {/* / → show the board (redirect to /login if not logged in) */}
          <Route
            path="/"
            element={user ? <Board /> : <Navigate to="/login" replace />}
          />

          {/* /card/:id → full card detail page (protected) */}
          <Route
            path="/card/:id"
            element={user ? <CardDetail /> : <Navigate to="/login" replace />}
          />

          {/* Catch-all: redirect unknown URLs to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
