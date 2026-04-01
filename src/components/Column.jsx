import { useState } from 'react'
import Card from './Card'

// Column accent colours (header bar at the top)
const COLUMN_COLORS = {
  'todo':        'bg-slate-400',
  'in-progress': 'bg-blue-500',
  'in-review':   'bg-violet-500',
  'done':        'bg-emerald-500',
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

  const handleDragOverList = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropIndex(getDropIndex(e.currentTarget, e.clientY))
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
  }

  const handleDragLeave = (e) => {
    // Only reset if we actually left the column (not just moved between children)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropIndex(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const cardId = e.dataTransfer.getData('text/plain')
    if (!cardId) return

    const targetIndex = getDropIndex(e.currentTarget, e.clientY)
    onMoveCard(cardId, id, targetIndex)
    setDropIndex(null)
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
        ) : columnCards.length === 0 && dropIndex !== null ? (
          <div className="flex items-center justify-center h-16 text-xs text-indigo-500 border-2 border-dashed border-indigo-300 rounded-lg bg-indigo-50">
            Drop here
          </div>
        ) : (
          <>
            {columnCards.map((card, index) => (
              <div key={card.id} data-card-id={card.id}>
                {dropIndex === index && (
                  <div className="h-1 bg-indigo-500 rounded-full mb-2 mx-1" />
                )}
                <Card
                  card={card}
                  onDelete={onDeleteCard}
                />
              </div>
            ))}

            {/* Drop indicator at the end of the list */}
            {dropIndex !== null && dropIndex >= columnCards.length && (
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
