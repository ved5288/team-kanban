import { useMemo, useState } from 'react'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns true if `rootId` is a descendant of `candidateId` in the card tree.
 * Used to prevent circular parent-child links.
 */
function isDescendant(candidateId, rootId, cards) {
  const children = cards[candidateId]?.childCardIds ?? []
  return children.some(
    (childId) => childId === rootId || isDescendant(childId, rootId, cards)
  )
}

// ── Remove icon (SVG, consistent with CardDetailModal) ────────────────────────

function RemoveIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// ── CardLinks ─────────────────────────────────────────────────────────────────

/**
 * Displays and manages parent/child card links for a given card.
 *
 * Props:
 *  card        - the current card object (required)
 *  board       - full board state (required)
 *  setBoard    - board state setter (required)
 *  onViewCard  - (cardId) => void  — opens another card's detail modal (required)
 */
export default function CardLinks({ card, board, setBoard, onViewCard }) {
  const [showAddParent, setShowAddParent] = useState(false)
  const [showAddChild, setShowAddChild] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const parentCard = card.parentCardId ? board.cards[card.parentCardId] : null
  const childCards = useMemo(
    () => (card.childCardIds ?? []).map((id) => board.cards[id]).filter(Boolean),
    [card.childCardIds, board.cards]
  )

  // Cards eligible to become the parent of this card
  const parentOptions = useMemo(
    () =>
      Object.values(board.cards).filter((c) => {
        if (c.id === card.id) return false
        if (c.id === card.parentCardId) return false
        if ((card.childCardIds ?? []).includes(c.id)) return false // already a direct child
        if (isDescendant(c.id, card.id, board.cards)) return false // deeper descendant — would create cycle
        return true
      }),
    [board.cards, card.id, card.parentCardId, card.childCardIds]
  )

  // Cards eligible to become children of this card
  const childOptions = useMemo(
    () =>
      Object.values(board.cards).filter((c) => {
        if (c.id === card.id) return false
        if ((card.childCardIds ?? []).includes(c.id)) return false // already a child
        if (c.id === card.parentCardId) return false // is the parent
        if (c.parentCardId) return false // already has a parent elsewhere
        return true
      }),
    [board.cards, card.id, card.parentCardId, card.childCardIds]
  )

  const filteredParentOptions = parentOptions.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredChildOptions = childOptions.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSetParent = (parentId) => {
    setBoard((prev) => {
      const newParent = prev.cards[parentId]
      const child = prev.cards[card.id]
      if (!newParent || !child) return prev

      const patches = {
        // Add this card to the new parent's children
        [parentId]: {
          ...newParent,
          childCardIds: [...(newParent.childCardIds ?? []), card.id],
        },
        // Point this card at the new parent
        [card.id]: { ...child, parentCardId: parentId },
      }

      // Clean up the old parent if one existed
      const oldParentId = child.parentCardId
      if (oldParentId && oldParentId !== parentId && prev.cards[oldParentId]) {
        patches[oldParentId] = {
          ...prev.cards[oldParentId],
          childCardIds: (prev.cards[oldParentId].childCardIds ?? []).filter((id) => id !== card.id),
        }
      }

      return { ...prev, cards: { ...prev.cards, ...patches } }
    })
    setShowAddParent(false)
    setSearchQuery('')
  }

  const handleRemoveParent = () => {
    setBoard((prev) => {
      const parentId = prev.cards[card.id]?.parentCardId
      if (!parentId) return prev
      const parent = prev.cards[parentId]
      return {
        ...prev,
        cards: {
          ...prev.cards,
          ...(parent ? {
            [parentId]: {
              ...parent,
              childCardIds: (parent.childCardIds ?? []).filter((id) => id !== card.id),
            },
          } : {}),
          [card.id]: { ...prev.cards[card.id], parentCardId: null },
        },
      }
    })
  }

  const handleAddChild = (childId) => {
    setBoard((prev) => {
      const parent = prev.cards[card.id]
      const child = prev.cards[childId]
      if (!parent || !child) return prev
      return {
        ...prev,
        cards: {
          ...prev.cards,
          [card.id]: {
            ...parent,
            childCardIds: [...(parent.childCardIds ?? []), childId],
          },
          [childId]: { ...child, parentCardId: card.id },
        },
      }
    })
    setShowAddChild(false)
    setSearchQuery('')
  }

  const handleRemoveChild = (childId) => {
    setBoard((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [card.id]: {
          ...prev.cards[card.id],
          childCardIds: (prev.cards[card.id].childCardIds ?? []).filter((id) => id !== childId),
        },
        [childId]: { ...prev.cards[childId], parentCardId: null },
      },
    }))
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Parent card */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Parent Card</p>
          {!parentCard && !showAddParent && (
            <button
              onClick={() => { setShowAddParent(true); setShowAddChild(false); setSearchQuery('') }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              + Set parent
            </button>
          )}
        </div>

        {parentCard ? (
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
            <button
              onClick={() => onViewCard?.(parentCard.id)}
              className="text-sm text-indigo-700 font-medium hover:underline truncate text-left flex-1"
            >
              {parentCard.title}
            </button>
            <button
              onClick={handleRemoveParent}
              title="Remove parent link"
              className="text-gray-300 hover:text-red-500 ml-2 shrink-0 transition-colors"
            >
              <RemoveIcon />
            </button>
          </div>
        ) : !showAddParent ? (
          <p className="text-sm text-gray-400 italic">No parent card.</p>
        ) : null}

        {showAddParent && (
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards…"
              className="w-full px-3 py-2 text-sm border-b border-gray-200 focus:outline-none"
              autoFocus
            />
            <div className="max-h-40 overflow-y-auto">
              {filteredParentOptions.length === 0 ? (
                <p className="text-xs text-gray-400 px-3 py-2 italic">No cards available</p>
              ) : (
                filteredParentOptions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSetParent(c.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 text-gray-700 border-b border-gray-100 last:border-0"
                  >
                    {c.title}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => { setShowAddParent(false); setSearchQuery('') }}
              className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Child cards */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Child Cards {childCards.length > 0 && <span className="text-gray-300">({childCards.length})</span>}
          </p>
          {!showAddChild && (
            <button
              onClick={() => { setShowAddChild(true); setShowAddParent(false); setSearchQuery('') }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              + Add child
            </button>
          )}
        </div>

        {childCards.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {childCards.map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                <button
                  onClick={() => onViewCard?.(c.id)}
                  className="text-sm text-gray-700 hover:text-indigo-600 hover:underline truncate text-left flex-1"
                >
                  {c.title}
                </button>
                <button
                  onClick={() => handleRemoveChild(c.id)}
                  title="Remove child link"
                  className="text-gray-300 hover:text-red-500 ml-2 shrink-0 transition-colors"
                >
                  <RemoveIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        {!showAddChild && childCards.length === 0 && (
          <p className="text-sm text-gray-400 italic">No child cards.</p>
        )}

        {showAddChild && (
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards…"
              className="w-full px-3 py-2 text-sm border-b border-gray-200 focus:outline-none"
              autoFocus
            />
            <div className="max-h-40 overflow-y-auto">
              {filteredChildOptions.length === 0 ? (
                <p className="text-xs text-gray-400 px-3 py-2 italic">No cards available</p>
              ) : (
                filteredChildOptions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleAddChild(c.id)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-gray-700 border-b border-gray-100 last:border-0"
                  >
                    {c.title}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => { setShowAddChild(false); setSearchQuery('') }}
              className="w-full px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
