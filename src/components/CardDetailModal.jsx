import { useState, useEffect } from 'react'
import { USERS, getUserColor, getUserInitials, getUserName } from '../data/users'

// ─── Column accent colours (mirrors Column.jsx) ───────────────────────────────

const COLUMN_COLORS = {
  'todo':        'bg-slate-400',
  'in-progress': 'bg-blue-500',
  'in-review':   'bg-violet-500',
  'done':        'bg-emerald-500',
}

const PRIORITIES = ['High', 'Medium', 'Low']

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
  if (seconds < 60)         return 'just now'
  if (seconds < 3600)       return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400)      return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`
  return formatDate(isoString)
}

// ─── CardDetailModal ──────────────────────────────────────────────────────────

/**
 * In-place popup modal for viewing and editing a card.
 *
 * Props:
 *  card        - the card data object
 *  columns     - full columns map from Board state (for column selector labels)
 *  columnOrder - ordered array of column IDs
 *  onSave      - (updatedCard) => void   called when the user saves changes
 *  onClose     - () => void              called to dismiss the modal
 */
export default function CardDetailModal({ card, columns, columnOrder, onSave, onClose }) {
  const [title,       setTitle]       = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [priority,    setPriority]    = useState(card.priority)
  const [assignee,    setAssignee]    = useState(card.assignee)
  const [columnId,    setColumnId]    = useState(card.columnId)

  // Derive the accent colour from the currently selected column
  const accentColor = COLUMN_COLORS[columnId] ?? 'bg-gray-400'

  // ── Escape key closes the modal ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      ...card,
      title:       title.trim(),
      description: description.trim(),
      priority,
      assignee,
      columnId,
    })
    onClose()
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Coloured header — matches the card's column */}
        <div className={`${accentColor} px-6 py-4 flex items-center justify-between`}>
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">
            {columns[columnId]?.title ?? columnId}
          </h2>
          <div className="flex items-center gap-3">
            {/* Open in new window */}
            <a
              href={`/card/${card.id}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in new window"
              className="text-white/70 hover:text-white transition-colors"
              title="Open in new window"
            >
              ↗
            </a>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-white/70 hover:text-white transition-colors text-xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-800
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Card title"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Add more detail..."
              rows={3}
            />
          </div>

          {/* Priority + Assignee row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Assignee
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {Object.values(USERS).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Column / Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
              Status
            </label>
            <select
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {columnOrder.map((cid) => (
                <option key={cid} value={cid}>{columns[cid]?.title ?? cid}</option>
              ))}
            </select>
          </div>

          <hr className="border-gray-100" />

          {/* Assignee preview + created date */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center
                            text-white text-xs font-bold shrink-0 ${getUserColor(assignee)}`}
              >
                {getUserInitials(assignee)}
              </div>
              <span>{getUserName(assignee)}</span>
            </div>
            <span title={formatDate(card.createdAt)}>
              Created {timeAgo(card.createdAt)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100
                         hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600
                         hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Save changes
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
