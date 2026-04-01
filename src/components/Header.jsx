import { useAuth } from '../App'
import { getUserColor, getUserInitials } from '../data/users'
import BoardSwitcher from './BoardSwitcher'

/**
 * Props:
 *  workspace     - full workspace object (passed from Board)
 *  onSwitchBoard - (boardId) => void
 *  onCreateBoard - (name) => void
 *  onRenameBoard - (boardId, name) => void
 *  onDeleteBoard - (boardId) => void
 */
export default function Header({ workspace, onSwitchBoard, onCreateBoard, onRenameBoard, onDeleteBoard }) {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">

      {/* Left: App name + board switcher */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">📋</span>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Team Kanban</h1>
        </div>

        {workspace && (
          <>
            <span className="text-gray-300">/</span>
            <BoardSwitcher
              workspace={workspace}
              onSwitch={onSwitchBoard}
              onCreate={onCreateBoard}
              onRename={onRenameBoard}
              onDelete={onDeleteBoard}
            />
          </>
        )}
      </div>

      {/* Right: User info + Logout */}
      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center
                          text-white text-xs font-bold ${getUserColor(user.id)}`}
            >
              {getUserInitials(user.id)}
            </div>
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
          </div>

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
