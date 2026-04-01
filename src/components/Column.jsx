import Card from './Card'

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

/**
 * Renders a single Kanban column.
 *
 * Props:
 *  column        - { id, title, cardIds }
 *  cards         - full cards map (id → card object) from Board state
 *  onAddCard     - (columnId) => void   opens the AddCard modal for this column
 *  onViewCard    - (cardId)   => void   opens the card detail popup
 *  onDeleteCard  - (cardId)   => void   deletes a card
 *  onDeleteLane  - (columnId) => void   deletes the lane (undefined for default lanes)
 */
export default function Column({ column, cards, onAddCard, onViewCard, onDeleteCard, onDeleteLane }) {
  const { id, title, cardIds } = column
  const columnCards = cardIds.map((cid) => cards[cid]).filter(Boolean)
  const accentColor = getColumnColor(id)

  return (
    <div className="flex flex-col w-72 shrink-0 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">

      {/* Column header */}
      <div className={`${accentColor} px-4 py-2`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full font-medium">
              {columnCards.length}
            </span>
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

      {/* Card list */}
      <div className="flex flex-col gap-2 p-3 flex-1 min-h-[120px] overflow-y-auto">
        {columnCards.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-xs text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
            No cards yet
          </div>
        ) : (
          columnCards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onView={onViewCard}
            />
          ))
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
