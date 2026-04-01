import { USERS } from '../../data/users'
import Avatar from '../Avatar'

export default function MentionDropdown({ query, onSelect }) {
  if (query === null) return null

  const users = Object.values(USERS).filter(u =>
    u.id.toLowerCase().includes(query.toLowerCase()) ||
    u.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 6)

  if (users.length === 0) return null

  return (
    <div className="absolute z-20 top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
      {users.map(u => (
        <button
          key={u.id}
          type="button"
          // onMouseDown + preventDefault keeps the textarea focused so the
          // cursor position remains accurate when we read it after selection.
          onMouseDown={e => { e.preventDefault(); onSelect(u.id) }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 text-left transition-colors"
        >
          <Avatar userId={u.id} />
          <div>
            <p className="text-sm font-medium text-gray-800">{u.name}</p>
            <p className="text-xs text-gray-400">@{u.id}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
