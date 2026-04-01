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

// ─── Card Component ───────────────────────────────────────────────────────────

/**
 * Renders a single Kanban card.
 *
 * Props:
 *  card      - the card data object { id, title, description, priority, assignee, createdAt }
 *  onDelete  - (cardId) => void   called when the user deletes the card
 */
export default function Card({ card, onDelete }) {
  const { id, title, description, priority, assignee, createdAt } = card

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    // Add a slight delay so the dragged element gets a visual style
    e.currentTarget.style.opacity = '0.4'
  }

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm
                 hover:shadow-md hover:border-gray-300 transition-all cursor-grab active:cursor-grabbing group"
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
