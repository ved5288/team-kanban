import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { INITIAL_BOARD } from '../data/mockData'
import { USERS, getUserName, getUserInitials, getUserColor } from '../data/users'

// ─── Card colour palette ──────────────────────────────────────────────────────

const CARD_COLORS = [
  { label: 'Slate',   value: 'bg-slate-400'   },
  { label: 'Red',     value: 'bg-red-500'     },
  { label: 'Orange',  value: 'bg-orange-500'  },
  { label: 'Amber',   value: 'bg-amber-500'   },
  { label: 'Green',   value: 'bg-emerald-500' },
  { label: 'Teal',    value: 'bg-teal-500'    },
  { label: 'Blue',    value: 'bg-blue-500'    },
  { label: 'Indigo',  value: 'bg-indigo-500'  },
  { label: 'Violet',  value: 'bg-violet-500'  },
  { label: 'Pink',    value: 'bg-pink-500'    },
]

// ─── Priority styles ──────────────────────────────────────────────────────────

const PRIORITY_STYLES = {
  High:   { badge: 'bg-red-100 text-red-700',     dot: 'bg-red-500'   },
  Medium: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  Low:    { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (seconds < 60)          return 'just now'
  if (seconds < 3600)        return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400)       return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 86400 * 30)  return `${Math.floor(seconds / 86400)}d ago`
  return formatDate(isoString)
}

// ─── CardDetail Component ─────────────────────────────────────────────────────

export default function CardDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [board, setBoard] = useLocalStorage('kanban_board', INITIAL_BOARD)

  // Support opening directly in edit mode (e.g. from the board's hover edit button)
  const card = board.cards[id]
  const startInEditMode = !!location.state?.editing && !!card

  const [isEditing, setIsEditing] = useState(startInEditMode)
  const [draft, setDraft] = useState(() => {
    if (!startInEditMode || !card) return null
    return {
      title: card.title,
      description: card.description ?? '',
      priority: card.priority,
      assignee: card.assignee,
      columnId: card.columnId,
      createdAt: card.createdAt,
      color: card.color ?? CARD_COLORS[0].value,
    }
  })
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (!showToast) return
    const timer = setTimeout(() => setShowToast(false), 5000)
    return () => clearTimeout(timer)
  }, [showToast])

  // ── Not found ────────────────────────────────────────────────────────────────

  if (!card) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-6xl">🤔</p>
          <h1 className="text-xl font-semibold text-gray-700">Card not found</h1>
          <p className="text-sm text-gray-500">This card may have been deleted.</p>
          <Link
            to="/"
            className="inline-block mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Back to board
          </Link>
        </div>
      </div>
    )
  }

  const { title, description, priority, assignee, columnId, createdAt, color } = card
  const column = board.columns[columnId]
  const columnTitle = column?.title ?? columnId
  const priorityStyle = PRIORITY_STYLES[priority] ?? { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }

  // ── Edit handlers ────────────────────────────────────────────────────────────

  const startEditing = () => {
    setDraft({
      title,
      description: description ?? '',
      priority,
      assignee,
      columnId,
      createdAt,
      color: color ?? CARD_COLORS[0].value,
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setDraft(null)
    setIsEditing(false)
  }

  const saveChanges = () => {
    if (!draft.title.trim()) return

    setBoard((prev) => {
      const oldColumnId = card.columnId
      const newColumnId = draft.columnId
      let updatedColumns = prev.columns

      // If the status changed, move the card between columns
      if (oldColumnId !== newColumnId) {
        updatedColumns = {
          ...prev.columns,
          [oldColumnId]: {
            ...prev.columns[oldColumnId],
            cardIds: prev.columns[oldColumnId].cardIds.filter((cid) => cid !== id),
          },
          [newColumnId]: {
            ...prev.columns[newColumnId],
            cardIds: [...prev.columns[newColumnId].cardIds, id],
          },
        }
      }

      return {
        ...prev,
        cards: {
          ...prev.cards,
          [id]: { ...prev.cards[id], ...draft },
        },
        columns: updatedColumns,
      }
    })
    setIsEditing(false)
    setDraft(null)
    setShowToast(true)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2
                        bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-3
                        text-sm font-medium text-gray-800">
          <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd"
              d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
              clipRule="evenodd" />
          </svg>
          Card updated successfully
        </div>
      )}

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-700 transition-colors text-sm font-medium flex items-center gap-1"
        >
          ← Back
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-500 truncate">{isEditing ? draft.title : title}</span>
      </div>

      {/* Card */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Colour stripe */}
          {(isEditing ? draft.color : color) && (
            <div className={`h-1.5 w-full ${isEditing ? draft.color : color}`} />
          )}

          <div className="p-8 space-y-6">

            {/* Title */}
            {isEditing ? (
              <input
                className="w-full text-2xl font-bold text-gray-900 border-b border-gray-300
                           focus:border-indigo-500 outline-none pb-1 bg-transparent"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 leading-snug">{title}</h1>
            )}

            {/* Meta row (read mode) */}
            {!isEditing && (
              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${priorityStyle.badge}`}>
                  {priority} priority
                </span>
                <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                  {columnTitle}
                </span>
              </div>
            )}

            {/* Status + Priority selects (edit mode) */}
            {isEditing && (
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                    Status
                  </label>
                  <select
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2
                               focus:outline-none focus:border-indigo-500"
                    value={draft.columnId}
                    onChange={(e) => setDraft({ ...draft, columnId: e.target.value })}
                  >
                    {board.columnOrder.map((colId) => (
                      <option key={colId} value={colId}>
                        {board.columns[colId]?.title ?? colId}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[140px]">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                    Priority
                  </label>
                  <select
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2
                               focus:outline-none focus:border-indigo-500"
                    value={draft.priority}
                    onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
                  >
                    {['High', 'Medium', 'Low'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <hr className="border-gray-100" />

            {/* Description */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Description
              </h2>
              {isEditing ? (
                <textarea
                  className="w-full text-sm text-gray-700 border border-gray-300 rounded-lg px-3 py-2
                             focus:outline-none focus:border-indigo-500 resize-none"
                  rows={4}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              ) : description ? (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{description}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">No description provided.</p>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Assignee + Created at */}
            <div className="flex items-start justify-between gap-6">

              {/* Assignee */}
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Assignee
                </h2>
                {isEditing ? (
                  <select
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2
                               focus:outline-none focus:border-indigo-500"
                    value={draft.assignee}
                    onChange={(e) => setDraft({ ...draft, assignee: e.target.value })}
                  >
                    {Object.keys(USERS).map((uid) => (
                      <option key={uid} value={uid}>{USERS[uid].name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center
                                  text-white text-sm font-bold shrink-0 ${getUserColor(assignee)}`}
                    >
                      {getUserInitials(assignee)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{getUserName(assignee)}</p>
                      <p className="text-xs text-gray-400">@{assignee}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Created at */}
              <div className="text-right">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Created
                </h2>
                {isEditing ? (
                  <input
                    type="date"
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2
                               focus:outline-none focus:border-indigo-500"
                    value={draft.createdAt.slice(0, 10)}
                    onChange={(e) =>
                      e.target.value &&
                      setDraft({ ...draft, createdAt: new Date(e.target.value).toISOString() })
                    }
                  />
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700">{timeAgo(createdAt)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(createdAt)}</p>
                  </>
                )}
              </div>

            </div>

            {/* Colour picker (edit mode only) */}
            {isEditing && (
              <>
                <hr className="border-gray-100" />
                <div>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Card colour
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {CARD_COLORS.map(({ label, value }) => (
                      <button
                        key={value}
                        title={label}
                        onClick={() => setDraft({ ...draft, color: value })}
                        className={`w-7 h-7 rounded-full ${value} transition-transform hover:scale-110 ${
                          draft.color === value ? 'ring-2 ring-offset-2 ring-gray-500 scale-110' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            <hr className="border-gray-100" />

            {/* Footer: card ID + action buttons */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-300 font-mono">ID: {id}</p>

              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={cancelEditing}
                    className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600
                               hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveChanges}
                    className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white
                               hover:bg-indigo-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEditing}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600
                             hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
