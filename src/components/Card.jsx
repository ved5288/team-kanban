import { useState } from 'react'
import { getUserColor, getUserInitials, getUserName } from '../data/users'
import { timeAgo } from '../utils/time'
import { getDueDateStatus, DUE_DATE_STYLES, formatDueDate } from '../utils/dueDateUtils'

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
 *  card      - the card data object { id, title, description, priority, assignee, createdAt, color, dueDate }
 *  onView    - (cardId) => void   called when the user clicks the card title or edit button
 */
export default function Card({ card, onView }) {
  const { id, title, description, priority, assignee, createdAt, color, dueDate } = card
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
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
        {/* Title — click to open the card detail popup */}
        <button
          onClick={() => onView(id)}
          className="block w-full text-left text-sm font-semibold text-gray-800 leading-snug mb-2
                     hover:text-indigo-600 transition-colors"
        >
          {title}
        </button>

        {/* Description (truncated) */}
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {description}
          </p>
        )}

        {/* Due date badge */}
        {dueDate && (() => {
          const status = getDueDateStatus(dueDate)
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

        {/* Footer: priority + assignee + time + edit button */}
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
    </div>
  )
}
