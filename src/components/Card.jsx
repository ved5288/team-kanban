import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getUserColor, getUserInitials, getUserName } from '../data/users'
import { timeAgo } from '../utils/time'

// ─── Priority badge styling ───────────────────────────────────────────────────

const PRIORITY_STYLES = {
  High:   'bg-red-100 text-red-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low:    'bg-green-100 text-green-700',
}

// ─── Card Component ───────────────────────────────────────────────────────────

/**
 * Renders a single Kanban card.
 *
 * Props:
 *  card      - the card data object { id, title, description, priority, assignee, createdAt, color }
 *  onDelete  - (cardId) => void   called when the user deletes the card
 */
export default function Card({ card, onDelete }) {
  const { id, title, description, priority, assignee, createdAt, color } = card
  const navigate = useNavigate()
  const [isDragging, setIsDragging] = useState(false)
  const wasDragged = useRef(false)

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
    wasDragged.current = true
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    // Reset the flag after a tick so the click handler can check it
    requestAnimationFrame(() => { wasDragged.current = false })
  }

  const handleLinkClick = (e) => {
    // Prevent navigation if the user just finished dragging
    if (wasDragged.current) {
      e.preventDefault()
    }
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm
                 hover:shadow-md hover:border-gray-300 transition-all cursor-grab active:cursor-grabbing group overflow-hidden
                 ${isDragging ? 'opacity-40' : 'opacity-100'}`}
    >
      {/* Colour stripe */}
      {color && <div className={`h-1 w-full ${color}`} />}

      <div className="p-3">
        {/* Title — click to open the full card detail page */}
        <Link
          to={`/card/${id}`}
          onClick={handleLinkClick}
          draggable={false}
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

        {/* Footer: priority + assignee + time + edit button */}
        <div className="flex items-center justify-between gap-2">

          {/* Left: priority badge */}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[priority] ?? 'bg-gray-100 text-gray-600'}`}>
            {priority}
          </span>

          {/* Right: assignee avatar + time + edit button */}
          <div className="flex items-center gap-2">
            {/* Edit button — visible on card hover */}
            <div className="relative">
              <button
                onClick={() => navigate(`/card/${id}`, { state: { editing: true } })}
                className="peer opacity-0 group-hover:opacity-100 transition-opacity
                           border border-gray-300 hover:border-indigo-400
                           text-gray-400 hover:text-indigo-600
                           p-1 rounded"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                               whitespace-nowrap rounded bg-gray-800 px-2 py-0.5 text-xs text-white
                               opacity-0 peer-hover:opacity-100 transition-opacity">
                Edit
              </span>
            </div>
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
    </div>
  )
}
