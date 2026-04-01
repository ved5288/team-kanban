import { Link } from 'react-router-dom'
import { getUserColor, getUserInitials, getUserName } from '../data/users'

// ─── Priority badge styling ───────────────────────────────────────────────────

const PRIORITY_STYLES = {
  High:   'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low:    'bg-green-100 text-green-700',
}

// ─── Relative timestamp ───────────────────────────────────────────────────────

function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (seconds < 60)           return 'just now'
  if (seconds < 3600)         return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400)        return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 86400 * 30)  return `${Math.floor(seconds / 86400)}d ago`
  return new Date(isoString).toLocaleDateString()
}

// ─── Due date helpers ─────────────────────────────────────────────────────────

function formatDueDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function dueDateStatus(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr + 'T00:00:00')
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0)  return 'overdue'   // past
  if (diffDays <= 3) return 'soon'      // today or within 3 days
  return 'upcoming'
}

const DUE_DATE_STYLES = {
  overdue:  'bg-red-50   text-red-600   border border-red-200',
  soon:     'bg-amber-50 text-amber-600 border border-amber-200',
  upcoming: 'bg-gray-50  text-gray-500  border border-gray-200',
}

// ─── Card Component ───────────────────────────────────────────────────────────

/**
 * Renders a single Kanban card.
 *
 * Props:
 *  card      - the card data object { id, title, description, priority, assignee, createdAt }
 *  onDelete  - (cardId) => void   called when the user deletes the card
 */
export default function Card({ card, onDelete }) {
  const { id, title, description, priority, assignee, createdAt, dueDate } = card

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm
                 hover:shadow-md hover:border-gray-300 transition-all cursor-default group"
    >
      {/* Title — click to open the full card detail page */}
      <Link
        to={`/card/${id}`}
        className="block text-sm font-semibold text-gray-800 leading-snug mb-2
                   hover:text-indigo-600 transition-colors"
      >
        {title}
      </Link>

      {/* Description (truncated) */}
      {description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
          {description}
        </p>
      )}

      {/* Due date badge */}
      {dueDate && (() => {
        const status = dueDateStatus(dueDate)
        return (
          <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${DUE_DATE_STYLES[status]}`}>
            <span className="leading-none">📅</span>
            <span>
              {status === 'overdue' ? 'Overdue · ' : 'Due · '}
              {formatDueDate(dueDate)}
            </span>
          </div>
        )
      })()}

      {/* Footer: priority + assignee + time */}
      <div className="flex items-center justify-between gap-2">

        {/* Left: priority badge */}
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[priority] ?? 'bg-gray-100 text-gray-600'}`}>
          {priority}
        </span>

        {/* Right: assignee avatar + time */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{timeAgo(createdAt)}</span>
          <div
            title={getUserName(assignee)}
            className={`w-6 h-6 rounded-full flex items-center justify-center
                        text-white text-xs font-bold shrink-0 ${getUserColor(assignee)}`}
          >
            {getUserInitials(assignee)}
          </div>
        </div>

      </div>
    </div>
  )
}
