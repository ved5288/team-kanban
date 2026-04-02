import { useState } from 'react'
import { USERS } from '../data/users'
import { useAuth } from '../App'

// Demo accounts shown as quick-fill chips at the bottom of the login form
const DEMO_ACCOUNTS = ['malvika', 'vaidehie', 'yash', 'riya', 'jitesh', 'nithish', 'bhavya', 'vedant']

export default function Login() {
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const key  = username.trim().toLowerCase()
    const user = USERS[key]

    if (user && user.password === password) {
      // Pass a safe user object to the auth context (no password!)
      login({ id: user.id, name: user.name, username: key })
    } else {
      setError('Incorrect username or password. Please try again.')
    }
  }

  // Quick-fill a demo account on chip click
  const fillDemo = (name) => {
    setUsername(name)
    setPassword('pass123')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📋</div>
          <h1 className="text-2xl font-bold text-gray-900">Team Kanban</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to access your board</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition-colors"
              placeholder="e.g. yash"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition-colors"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium
                       py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2
                       focus:ring-indigo-500 focus:ring-offset-2"
          >
            Sign In
          </button>
        </form>

        {/* Demo account chips */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-2">
            Quick fill a demo account <span className="text-gray-400">(password: pass123)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => fillDemo(name)}
                className="text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700
                           text-gray-600 px-3 py-1.5 rounded-full border border-gray-200
                           hover:border-indigo-200 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
