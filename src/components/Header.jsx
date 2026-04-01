import { useAuth } from '../App'
import { getUserColor, getUserInitials } from '../data/users'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">

      {/* Left: App name */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">📋</span>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Team Kanban</h1>
          <p className="text-xs text-gray-400 leading-tight">Project Board</p>
        </div>
      </div>

      {/* Right: User info + Logout */}
      {user && (
        <div className="flex items-center gap-4">

          {/* User avatar + name */}
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center
                          text-white text-xs font-bold ${getUserColor(user.id)}`}
            >
              {getUserInitials(user.id)}
            </div>
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-red-600 hover:bg-red-50
                       px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign out
          </button>

        </div>
      )}
    </header>
  )
}
