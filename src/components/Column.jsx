import { useState } from 'react'
import Card from './Card'

// Column accent colours (header bar at the top)
const COLUMN_COLORS = {
  'todo':        'bg-slate-400',
  'in-progress': 'bg-blue-500',
  'in-review':   'bg-violet-500',
  'done':        'bg-emerald-500',
}

/**
 * Renders a single Kanban column with drag-and-drop support.
 *
 * Props:
 *  column        - { id, title, cardIds }
 *  cards         - full cards map (id -> card object) from Board state
 *  onAddCard     - (columnId) => void   opens the AddCard modal for this column
 *  onDeleteCard  - (cardId)   => void   deletes a card
 *  onMoveCard    - (cardId, targetColumnId, targetIndex) => void   moves a card
 */
export default function Column({ column, cards, onAddCard, onDeleteCard, onMoveCard }) {
  const { id, title, cardIds } = column
  const columnCards = cardIds.map((cid) => cards[cid]).filter(Boolean)
  const accentColor = COLUMN_COLORS[id] ?? 'bg-gray-400'

  // Track where the drop indicator should appear: index in the card list
  const [dropIndex, setDropIndex] = useState(null)

  // Which card is being dragged (so we don't show indicator on itself)
  const [draggedCardId, setDraggedCardId] = useState(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  // Calculate which index the card should drop at based on mouse Y position
  const handleDragOverList = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    const cardId = e.dataTransfer.types.includes('text/plain') ? true : false
    if (!cardId) return

    const listEl = e.currentTarget
    const cardElements = Array.from(listEl.querySelectorAll('[data-card-id]'))

    if (cardElements.length === 0) {
      setDropIndex(0)
      return
    }

    const mouseY = e.clientY
    let targetIndex = cardElements.length // default: drop at end

    for (let i = 0; i < cardElements.length; i++) {
      const rect = cardElements[i].getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      if (mouseY < midpoint) {
        targetIndex = i
        break
      }
    }

    setDropIndex(targetIndex)
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    // Read the dragged card ID from dataTransfer
    setDraggedCardId(null) // reset — actual ID read on drop
  }

  const handleDragLeave = (e) => {
    // Only reset if we actually left the column (not just moved between children)
    const relatedTarget = e.relatedTarget
    if (!e.currentTarget.contains(relatedTarget)) {
      setDropIndex(null)
      setDraggedCardId(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const cardId = e.dataTransfer.getData('text/plain')
    if (!cardId) return

    // Calculate final drop index from mouse position
    const listEl = e.currentTarget
    const cardElements = Array.from(listEl.querySelectorAll('[data-card-id]'))
    const mouseY = e.clientY
    let targetIndex = cardElements.length

    for (let i = 0; i < cardElements.length; i++) {
      const rect = cardElements[i].getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      if (mouseY < midpoint) {
        targetIndex = i
        break
      }
    }

    onMoveCard(cardId, id, targetIndex)
    setDropIndex(null)
    setDraggedCardId(null)
  }

  return (
    <div className="flex flex-col w-72 shrink-0 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">

      {/* Column header */}
      <div className={`${accentColor} px-4 py-2`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full font-medium">
            {columnCards.length}
          </span>
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
        {columnCards.length === 0 && dropIndex === null ? (
          <div className="flex items-center justify-center h-16 text-xs text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
            No cards yet
          </div>
        ) : (
          columnCards.map((card, index) => (
            <div key={card.id} data-card-id={card.id}>
              {/* Drop indicator — shown above this card */}
              {dropIndex === index && (
                <div className="h-1 bg-indigo-500 rounded-full mb-2 mx-1 transition-all" />
              )}
              <Card
                card={card}
                onDelete={onDeleteCard}
              />
            </div>
          ))
        )}

        {/* Drop indicator at the end of the list */}
        {dropIndex !== null && dropIndex >= columnCards.length && (
          <div className="h-1 bg-indigo-500 rounded-full mx-1 transition-all" />
        )}

        {/* Empty column highlight when dragging over */}
        {columnCards.length === 0 && dropIndex !== null && (
          <div className="flex items-center justify-center h-16 text-xs text-indigo-500 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50">
            Drop here
          </div>
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
