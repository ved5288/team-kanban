import { useState, useRef } from 'react'
import { getUserColor, getUserInitials, getUserName } from '../data/users'
import { timeAgo } from '../utils/time'
import { getDueDateStatus, DUE_DATE_STYLES, formatDueDate } from '../utils/dueDateUtils'
import { getCardChecklistSummary } from './checklists/checklistHelpers'

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
  const wasDragged = useRef(false)

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
    wasDragged.current = true
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    requestAnimationFrame(() => { wasDragged.current = false })
  }

  const handleClick = () => {
    if (wasDragged.current) return
    onView(id)
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm
                 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group overflow-hidden
                 ${isDragging ? 'opacity-40' : 'opacity-100'}`}
    >
      {/* Colour stripe */}
      {color && <div className={`h-1 w-full ${color}`} />}

      <div className="p-3">
        {/* Title */}
        <p className="text-sm font-semibold text-gray-800 leading-snug mb-2">
          {title}
        </p>

        {/* Description (truncated) */}
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {description}
          </p>
        )}

        {/* Checklist badge */}
        {(() => {
          const summary = getCardChecklistSummary(card)
          if (!summary) return null
          const allDone = summary.completed === summary.total
          return (
            <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${
              allDone ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>{summary.completed}/{summary.total}</span>
            </div>
          )
        })()}

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
