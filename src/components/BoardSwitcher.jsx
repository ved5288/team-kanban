import { useState, useRef, useEffect } from 'react'

/**
 * Board switcher dropdown embedded in the Header.
 *
 * Props:
 *  workspace   - full workspace object { activeBoardId, boards }
 *  onSwitch    - (boardId) => void
 *  onCreate    - (name) => void
 *  onRename    - (boardId, name) => void
 *  onDelete    - (boardId) => void
 */
export default function BoardSwitcher({ workspace, onSwitch, onCreate, onRename, onDelete }) {
  const [isOpen, setIsOpen]         = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName]       = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const ref = useRef(null)

  const boards    = Object.values(workspace.boards)
  const active    = workspace.boards[workspace.activeBoardId]
  const canDelete = boards.length > 1

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setIsOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCreate = (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    onCreate(newName.trim())
    setNewName('')
    setIsCreating(false)
    setIsOpen(false)
  }

  const handleRenameSubmit = (e, boardId) => {
    e.preventDefault()
    if (!renameValue.trim()) return
    onRename(boardId, renameValue.trim())
    setRenamingId(null)
  }

  return (
    <div ref={ref} className="relative">

      {/* Trigger */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors group max-w-48"
      >
        <span className="text-sm font-semibold text-gray-800 truncate">{active?.name ?? 'Board'}</span>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">

          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Your Boards</p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {boards.map((board) => (
              <div key={board.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 group/row">
                {renamingId === board.id ? (
                  <form
                    onSubmit={(e) => handleRenameSubmit(e, board.id)}
                    className="flex-1 flex gap-2 items-center"
                  >
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => setRenamingId(null)}
                      className="flex-1 text-sm px-2 py-1 border border-indigo-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <button type="submit" className="text-xs text-indigo-600 font-semibold shrink-0">
                      Save
                    </button>
                  </form>
                ) : (
                  <>
                    {/* Board name — click to switch */}
                    <button
                      onClick={() => { onSwitch(board.id); setIsOpen(false) }}
                      className="flex-1 text-left text-sm truncate"
                    >
                      <span className={board.id === workspace.activeBoardId
                        ? 'text-indigo-600 font-semibold'
                        : 'text-gray-700 font-medium'
                      }>
                        {board.id === workspace.activeBoardId && (
                          <span className="mr-1">✓</span>
                        )}
                        {board.name}
                      </span>
                    </button>

                    {/* Rename + Delete — visible on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setRenamingId(board.id)
                          setRenameValue(board.name)
                        }}
                        title="Rename board"
                        className="p-1 text-gray-400 hover:text-gray-700 rounded transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>

                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(board.id)
                            setIsOpen(false)
                          }}
                          title="Delete board"
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Create new board */}
          <div className="border-t border-gray-100 p-2">
            {isCreating ? (
              <form onSubmit={handleCreate} className="flex gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Board name…"
                  className="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium shrink-0"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setNewName('') }}
                  className="px-2 py-1.5 text-sm text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
              >
                + Create new board
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
