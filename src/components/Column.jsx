import { useState, useRef, useCallback } from 'react'
import Card from './Card'
import { getCardChecklistSummary } from './checklists/checklistHelpers'

// Column accent colours (header bar at the top)
const COLUMN_COLORS = {
  'todo':        'bg-slate-400',
  'in-progress': 'bg-blue-500',
  'in-review':   'bg-violet-500',
  'done':        'bg-emerald-500',
}

// Rotating palette for dynamically added lanes
const DYNAMIC_COLORS = [
  'bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-cyan-500',
  'bg-pink-500', 'bg-lime-500', 'bg-orange-500', 'bg-sky-500',
]

function getColumnColor(id) {
  if (COLUMN_COLORS[id]) return COLUMN_COLORS[id]
  // Stable hash from the column id to pick a color
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  return DYNAMIC_COLORS[Math.abs(hash) % DYNAMIC_COLORS.length]
}

// Given a list container element and a mouse Y position, returns the index
// where a dropped card should be inserted.
function getDropIndex(listEl, mouseY) {
  const cardElements = Array.from(listEl.querySelectorAll('[data-card-id]'))

  if (cardElements.length === 0) return 0

  for (let i = 0; i < cardElements.length; i++) {
    const rect = cardElements[i].getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    if (mouseY < midpoint) return i
  }

  return cardElements.length
}

/**
 * Renders a single Kanban column with drag-and-drop support.
 *
 * Props:
 *  column          - { id, title, cardIds }
 *  cards           - full cards map (id → card object) from Board state
 *  filteredCardIds - array of card IDs that passed active filters (subset of column.cardIds)
 *  isFiltering     - boolean: true when any filter is active
 *  onAddCard       - (columnId) => void   opens the AddCard modal for this column
 *  onViewCard      - (cardId)   => void   opens the card detail popup
 *  onDeleteCard    - (cardId)   => void   deletes a card
 *  onMoveCard      - (cardId, targetColumnId, targetIndex) => void   moves a card
 *  onDeleteLane    - (columnId) => void   deletes the lane (undefined for default lanes)
 *  isSelecting     - bool: bulk selection mode active
 *  isSelected      - (cardId) => bool
 *  onSelectCard    - (cardId, e) => void
 */
export default function Column({ column, cards, filteredCardIds, isFiltering, onAddCard, onViewCard, onDeleteCard, onMoveCard, onDeleteLane, isSelecting, isSelected, onSelectCard }) {
  const { id, title, cardIds } = column
  // Use filtered IDs when provided, fall back to all IDs for backward compatibility
  const columnCards = (filteredCardIds ?? cardIds).map((cid) => cards[cid]).filter(Boolean)
  const accentColor = getColumnColor(id)

  // Aggregate checklist progress across all cards in this column
  const columnChecklistProgress = (() => {
    let total = 0
    let completed = 0
    for (const card of columnCards) {
      const summary = getCardChecklistSummary(card)
      if (summary) {
        total += summary.total
        completed += summary.completed
      }
    }
    if (total === 0) return null
    return { total, completed }
  })()

  // Track where the drop indicator should appear: index in the card list
  const [dropIndex, setDropIndex] = useState(null)
  // Track whether something is being dragged over this column
  const [isDragOver, setIsDragOver] = useState(false)
  // Cache the last drop index to avoid redundant re-renders
  const lastDropIndexRef = useRef(null)

  const handleDragOverList = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const index = getDropIndex(e.currentTarget, e.clientY)
    // Only update state if the index actually changed
    if (lastDropIndexRef.current !== index) {
      lastDropIndexRef.current = index
      setDropIndex(index)
    }
  }, [])

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    // Only reset if we actually left the column (not just moved between children)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropIndex(null)
      setIsDragOver(false)
      lastDropIndexRef.current = null
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    const cardId = e.dataTransfer.getData('text/plain')

    // Validate: only process drops of actual cards from this app
    if (!cardId || !cards[cardId]) {
      setDropIndex(null)
      setIsDragOver(false)
      lastDropIndexRef.current = null
      return
    }

    const targetIndex = getDropIndex(e.currentTarget, e.clientY)
    onMoveCard(cardId, id, targetIndex)
    setDropIndex(null)
    setIsDragOver(false)
    lastDropIndexRef.current = null
  }, [cards, id, onMoveCard])

  // Find the index of the card currently being dragged (if it's in this column)
  // so we can suppress the indicator at its own position
  const getDraggedCardIndex = () => {
    if (dropIndex === null) return -1
    // We can't read the card ID during dragover (browser restriction),
    // so we detect it by checking which card has opacity-40 (isDragging state)
    const draggedEl = document.querySelector('[class*="opacity-40"][draggable="true"]')
    if (!draggedEl) return -1
    const wrapper = draggedEl.closest('[data-card-id]')
    if (!wrapper) return -1
    const draggedId = wrapper.getAttribute('data-card-id')
    return cardIds.indexOf(draggedId)
  }

  const draggedCardIndex = getDraggedCardIndex()
  // Suppress indicator if it would result in no visual change
  const effectiveDropIndex = (draggedCardIndex >= 0 &&
    (dropIndex === draggedCardIndex || dropIndex === draggedCardIndex + 1))
    ? null
    : dropIndex

  return (
    <div className={`flex flex-col w-72 shrink-0 rounded-xl overflow-hidden border transition-colors
                     ${isDragOver ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-100 border-gray-200'}`}>

      {/* Column header */}
      <div className={`${accentColor} px-4 py-2`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full font-medium">
              {isFiltering ? `${columnCards.length}/${cardIds.length}` : columnCards.length}
            </span>
            {columnChecklistProgress && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  columnChecklistProgress.completed === columnChecklistProgress.total
                    ? 'bg-green-400/30 text-white'
                    : 'bg-white/15 text-white/80'
                }`}
                title={`${columnChecklistProgress.completed}/${columnChecklistProgress.total} checklist items done`}
              >
                {columnChecklistProgress.completed}/{columnChecklistProgress.total}
              </span>
            )}
            {onDeleteLane && (
              <button
                onClick={() => onDeleteLane(id)}
                className="text-white/60 hover:text-white transition-colors text-sm leading-none"
                title="Delete lane"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card list — drop zone */}
      <div
        className="flex flex-col gap-2 p-3 flex-1 min-h-[120px] overflow-y-auto"
        onDragOver={handleDragOverList}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {columnCards.length === 0 && effectiveDropIndex === null ? (
          isFiltering ? (
            <div className="flex flex-col items-center justify-center h-16 gap-1
                            text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-lg
                            bg-gray-50/50">
              <span className="text-base">🔍</span>
              <span>No cards match the current filters</span>
            </div>
          ) : (
            <div className="flex items-center justify-center h-16 text-xs text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
              No cards yet
            </div>
          )
        ) : columnCards.length === 0 && effectiveDropIndex !== null ? (
          <div className="flex items-center justify-center h-16 text-xs text-indigo-500 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50">
            Drop here
          </div>
        ) : (
          <>
            {columnCards.map((card, index) => (
              <div key={card.id} data-card-id={card.id}>
                {effectiveDropIndex === index && (
                  <div className="h-1 bg-indigo-500 rounded-full mb-2 mx-1" />
                )}
                <Card
                  card={card}
                  onView={onViewCard}
                  isSelecting={isSelecting}
                  isSelected={isSelected?.(card.id) ?? false}
                  onSelect={onSelectCard}
                />
              </div>
            ))}

            {/* Drop indicator at the end of the list */}
            {effectiveDropIndex !== null && effectiveDropIndex >= columnCards.length && (
              <div className="h-1 bg-indigo-500 rounded-full mx-1" />
            )}
          </>
        )}
      </div>

      {/* Add card button */}
      <div className="p-3 pt-0">
        <button
          onClick={() => onAddCard(id)}
          className="w-full text-sm text-gray-500 hover:text-indigo-700 hover:bg-white
                     border border-dashed border-gray-300 hover:border-indigo-300
                     py-2 rounded-lg transition-all"
        >
          + Add card
        </button>
      </div>

    </div>
  )
}
