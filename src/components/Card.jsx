import { useState, useRef } from 'react'
import { getUserColor, getUserInitials, getUserName } from '../data/users'
import { timeAgo } from '../utils/time'
import { getDueDateStatus, DUE_DATE_STYLES, formatDueDate } from '../utils/dueDateUtils'
import LabelsModal from './LabelsModal'

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
 *  card          - the card data object { id, title, description, priority, assignee, createdAt, color, dueDate, labelIds }
 *  onView        - (cardId) => void   called when the user clicks the card
 *  onUpdateCard  - (updatedCard) => void   called to persist label changes
 *  labels        - Label[]   board-wide label definitions
 *  onAddLabel    - (name, symbol) => void  create a new board-level label
 *  isSelecting   - bool: bulk selection mode is active
 *  isSelected    - bool: this card is currently selected
 *  onSelect      - (cardId, e) => void: called on click during selection mode
 */
export default function Card({ card, onView, onUpdateCard, labels = [], onAddLabel, isSelecting = false, isSelected = false, onSelect }) {
  const { id, title, description, priority, assignee, createdAt, color, dueDate, parentCardId, childCardIds } = card
  const hasParent  = !!parentCardId
  const childCount = (childCardIds ?? []).length
  const cardLabelIds = card.labelIds ?? []
  const cardLabels   = cardLabelIds.map((lid) => labels.find((l) => l.id === lid)).filter(Boolean)

  const [isDragging,   setIsDragging]   = useState(false)
  const [labelsOpen,   setLabelsOpen]   = useState(false)
  const wasDragged = useRef(false)

  const handleDragStart = (e) => {
    if (isSelecting) { e.preventDefault(); return }
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
    wasDragged.current = true
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    requestAnimationFrame(() => { wasDragged.current = false })
  }

  const handleClick = (e) => {
    if (isSelecting) { onSelect?.(id, e); return }
    if (wasDragged.current) return
    onView(id)
  }

  const handleToggleLabel = (labelId) => {
    const updated = cardLabelIds.includes(labelId)
      ? cardLabelIds.filter((lid) => lid !== labelId)
      : [...cardLabelIds, labelId]
    onUpdateCard?.({ ...card, labelIds: updated })
  }

  const openLabels = (e) => {
    e.stopPropagation()
    setLabelsOpen((v) => !v)
  }

  return (
    <div
      draggable={!isSelecting}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={`bg-white rounded-lg border shadow-sm transition-all overflow-visible
                 ${isSelecting
                   ? `cursor-pointer ${isSelected
                       ? 'border-indigo-500 ring-2 ring-indigo-400 shadow-indigo-100'
                       : 'border-gray-200 hover:border-indigo-300'}`
                   : 'border-gray-200 hover:shadow-md hover:border-gray-300 cursor-grab active:cursor-grabbing group'
                 }
                 ${isDragging ? 'opacity-40' : 'opacity-100'}`}
    >
      {/* Colour stripe */}
      {color && <div className={`h-1 w-full rounded-t-lg ${color}`} />}

      <div className="p-3">

        {/* Selection mode: checkbox + title inline */}
        {isSelecting ? (
          <div className="flex items-start gap-2 mb-2">
            <span className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                              ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
              {isSelected && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                </svg>
              )}
            </span>
            <span className="text-sm font-semibold text-gray-800 leading-snug">{title}</span>
          </div>
        ) : (
          <p className="text-sm font-semibold text-gray-800 leading-snug mb-2">
            {title}
          </p>
        )}

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

        {/* Labels row */}
        {!isSelecting && (
          <div className="relative flex items-center gap-1 flex-wrap mb-2">
            {/* Existing label chips — clicking opens the modal */}
            {cardLabels.map((label) => (
              <button
                key={label.id}
                onClick={openLabels}
                title={label.name}
                className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5
                           bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full
                           hover:bg-indigo-100 transition-colors"
              >
                <span className="leading-none text-sm">{label.symbol}</span>
                <span>{label.name}</span>
              </button>
            ))}

            {/* Tag button — always visible on hover when no labels; always visible when labels exist */}
            <button
              onClick={openLabels}
              title="Add labels"
              className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border
                          transition-colors
                          ${cardLabels.length > 0
                            ? 'text-gray-400 border-transparent hover:border-gray-300 hover:text-indigo-500'
                            : 'text-gray-400 border-dashed border-gray-300 hover:border-indigo-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100'
                          }`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a0 0 0 014-4z" />
              </svg>
              {cardLabels.length === 0 && <span>Label</span>}
            </button>

            {/* Labels popup */}
            {labelsOpen && (
              <LabelsModal
                labels={labels}
                cardLabelIds={cardLabelIds}
                onToggleLabel={handleToggleLabel}
                onAddLabel={onAddLabel}
                onClose={() => setLabelsOpen(false)}
              />
            )}
          </div>
        )}

        {/* Parent/child link indicators */}
        {(hasParent || childCount > 0) && (
          <div className="flex items-center gap-1.5 mb-2">
            {hasParent && (
              <span className="inline-flex items-center gap-1 text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                ↑ Parent
              </span>
            )}
            {childCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                ↓ {childCount} {childCount === 1 ? 'child' : 'children'}
              </span>
            )}
          </div>
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
    </div>
  )
}
