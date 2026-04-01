import { useState, useRef, useEffect } from 'react'
import { USERS, getUserName } from '../data/users'

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low']
const ASSIGNEE_OPTIONS = Object.values(USERS).sort((a, b) => a.name.localeCompare(b.name))

/**
 * Sticky action bar shown at the bottom of the board during bulk selection mode.
 *
 * Props:
 *  selectedCount  - number of currently selected cards
 *  totalCount     - total visible cards (for "Select all")
 *  columns        - board.columns map
 *  columnOrder    - board.columnOrder array
 *  onSelectAll    - () => void
 *  onDeselectAll  - () => void
 *  onExit         - () => void  — exits selection mode
 *  onDelete       - () => void
 *  onMove         - (targetColumnId) => void
 *  onUpdate       - (field, value) => void
 */
export default function BulkActionBar({
  selectedCount, totalCount, columns, columnOrder,
  onSelectAll, onDeselectAll, onExit,
  onDelete, onMove, onUpdate,
}) {
  const [moveOpen, setMoveOpen]       = useState(false)
  const [assigneeOpen, setAssigneeOpen] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)
  const [dueDateOpen, setDueDateOpen] = useState(false)

  const barRef = useRef(null)
  const dueDateRef = useRef(null)

  // Close all dropdowns when clicking outside the action bar
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) {
        setMoveOpen(false)
        setAssigneeOpen(false)
        setPriorityOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const hasSelection = selectedCount > 0

  const closeAll = () => { setMoveOpen(false); setAssigneeOpen(false); setPriorityOpen(false); setDueDateOpen(false) }

  return (
    <div ref={barRef}
         className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40
                    bg-gray-900 text-white rounded-2xl shadow-2xl
                    flex items-center gap-1 px-3 py-2 text-sm
                    border border-gray-700 select-none"
         style={{ minWidth: 520 }}>

      {/* Selection count */}
      <span className="font-semibold text-white px-2 shrink-0">
        {selectedCount} selected
      </span>

      <div className="w-px h-5 bg-gray-600 mx-1" />

      {/* Select all / deselect */}
      <button
        onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
        className="px-2 py-1 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors text-xs"
      >
        {selectedCount === totalCount ? 'Deselect all' : `Select all (${totalCount})`}
      </button>

      <div className="w-px h-5 bg-gray-600 mx-1" />

      {/* ── Move to lane ── */}
      <div className="relative">
        <button
          disabled={!hasSelection}
          onClick={() => { closeAll(); setMoveOpen((v) => !v) }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg
                     disabled:opacity-40 hover:bg-gray-700 transition-colors text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Move to
          <svg className={`w-3 h-3 transition-transform ${moveOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {moveOpen && (
          <div className="absolute bottom-full mb-2 left-0 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200 py-1 w-44 z-50">
            {columnOrder.map((colId) => (
              <button
                key={colId}
                onClick={() => { onMove(colId); closeAll() }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                {columns[colId]?.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Change assignee ── */}
      <div className="relative">
        <button
          disabled={!hasSelection}
          onClick={() => { closeAll(); setAssigneeOpen((v) => !v) }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg
                     disabled:opacity-40 hover:bg-gray-700 transition-colors text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Assignee
          <svg className={`w-3 h-3 transition-transform ${assigneeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {assigneeOpen && (
          <div className="absolute bottom-full mb-2 left-0 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200 py-1 w-44 z-50 max-h-56 overflow-y-auto">
            {ASSIGNEE_OPTIONS.map((u) => (
              <button
                key={u.id}
                onClick={() => { onUpdate('assignee', u.id); closeAll() }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                {u.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Change priority ── */}
      <div className="relative">
        <button
          disabled={!hasSelection}
          onClick={() => { closeAll(); setPriorityOpen((v) => !v) }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg
                     disabled:opacity-40 hover:bg-gray-700 transition-colors text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
          </svg>
          Priority
          <svg className={`w-3 h-3 transition-transform ${priorityOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {priorityOpen && (
          <div className="absolute bottom-full mb-2 left-0 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200 py-1 w-32 z-50">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p}
                onClick={() => { onUpdate('priority', p); closeAll() }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Set due date ── */}
      <div className="relative" ref={dueDateRef}>
        <button
          disabled={!hasSelection}
          onClick={() => { closeAll(); setDueDateOpen((v) => !v) }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg
                     disabled:opacity-40 hover:bg-gray-700 transition-colors text-xs"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Due date
          <svg className={`w-3 h-3 transition-transform ${dueDateOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {dueDateOpen && (
          <div className="absolute bottom-full mb-2 left-0 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200 p-3 z-50 w-52">
            <p className="text-xs text-gray-500 mb-2 font-medium">Set due date for selected cards</p>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                if (e.target.value) {
                  onUpdate('dueDate', e.target.value)
                  closeAll()
                }
              }}
              className="w-full text-sm border border-gray-300 rounded-lg px-2 py-1.5
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            />
            <button
              onClick={() => { onUpdate('dueDate', null); closeAll() }}
              className="mt-2 w-full text-xs text-red-500 hover:text-red-700 transition-colors text-left"
            >
              Clear due date
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-gray-600 mx-1" />

      {/* ── Delete ── */}
      <button
        disabled={!hasSelection}
        onClick={onDelete}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-red-400
                   disabled:opacity-40 hover:bg-red-900/40 hover:text-red-300 transition-colors text-xs"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>

      <div className="w-px h-5 bg-gray-600 mx-1" />

      {/* ── Exit ── */}
      <button
        onClick={onExit}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-400
                   hover:bg-gray-700 hover:text-white transition-colors text-xs"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span className="text-gray-500 text-xs">Esc</span>
      </button>

    </div>
  )
}
