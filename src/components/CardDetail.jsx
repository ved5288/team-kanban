import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { INITIAL_BOARD } from '../data/mockData'
import { getUserName, getUserInitials, getUserColor } from '../data/users'

// ─── Priority styles ──────────────────────────────────────────────────────────

const PRIORITY_STYLES = {
  High:   { badge: 'bg-red-100 text-red-700',     dot: 'bg-red-500'   },
  Medium: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  Low:    { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/**
 * Full-page detail view for a single card.
 *
 * Reads card data directly from localStorage (same source as Board).
 * URL: /card/:id
 */
export default function CardDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Read the live board from localStorage (same key as Board.jsx)
  const [board] = useLocalStorage('kanban_board', INITIAL_BOARD)

  const card = board.cards[id]

  // ── Not found ───────────────────────────────────────────────────────────────

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

  // ── Derived values ──────────────────────────────────────────────────────────

  const { title, description, priority, assignee, columnId, createdAt } = card
  const column = board.columns[columnId]
  const columnTitle = column?.title ?? columnId
  const priorityStyle = PRIORITY_STYLES[priority] ?? { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-gray-700 transition-colors text-sm font-medium flex items-center gap-1"
        >
          ← Back
        </button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-500 truncate">{title}</span>
      </div>

      {/* Card detail */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Priority stripe at the top */}
          <div className={`h-1.5 w-full ${priorityStyle.dot}`} />

          <div className="p-8 space-y-6">

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 leading-snug">
              {title}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Priority badge */}
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${priorityStyle.badge}`}>
                {priority} priority
              </span>

              {/* Column / status */}
              <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                {columnTitle}
              </span>
            </div>

            {/* Divider */}
            <hr className="border-gray-100" />

            {/* Description */}
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Description
              </h2>
              {description ? (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">No description provided.</p>
              )}
            </div>

            {/* Divider */}
            <hr className="border-gray-100" />

            {/* Assignee + created at */}
            <div className="flex items-start justify-between gap-6">

              {/* Assignee */}
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Assignee
                </h2>
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
              </div>

              {/* Created at */}
              <div className="text-right">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Created
                </h2>
                <p className="text-sm font-medium text-gray-700">{timeAgo(createdAt)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(createdAt)}</p>
              </div>

            </div>

            {/* Card ID (helpful for debugging / workshop context) */}
            <p className="text-xs text-gray-300 font-mono pt-2">
              ID: {id}
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}
