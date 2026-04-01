import { useState, useMemo, useRef, useEffect } from 'react'
import { INITIAL_BOARD } from '../data/mockData'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { applyFilters, countActiveFilters } from '../utils/filterUtils'
import Header from './Header'
import Column from './Column'
import AddCardModal from './AddCardModal'
import CardDetailModal from './CardDetailModal'
import FilterBar from './FilterBar'

/**
 * The main board view.
 *
 * State is stored in localStorage so it persists across page reloads.
 * The board shape is:
 *   { cards: {id → card}, columns: {id → column}, columnOrder: [id] }
 *
 * Key operations:
 *  - addCard:    adds a new card to a column
 *  - deleteCard: removes a card from board state
 */
export default function Board() {
  // Board data persisted in localStorage
  const [board, setBoard] = useLocalStorage('kanban_board', INITIAL_BOARD)

  // Which column's "Add card" was clicked (null = modal closed)
  const [addingToColumn, setAddingToColumn] = useState(null)

  // Which card's detail popup is open (null = closed, string = cardId)
  const [viewingCardId, setViewingCardId] = useState(null)

  // Active filter state — view-only, does not mutate board data
  const [activeFilters, setActiveFilters] = useState({
    priority:   [],
    assignees:  [],
    dateFilter: null,
  })

  // Derived: cards that pass all active filters
  const filteredCards = useMemo(
    () => applyFilters(board.cards, activeFilters),
    [board.cards, activeFilters]
  )

  // "Add lane" inline input state
  const [isAddingLane, setIsAddingLane] = useState(false)
  const [newLaneName, setNewLaneName] = useState('')
  const newLaneInputRef = useRef(null)

  useEffect(() => {
    if (isAddingLane && newLaneInputRef.current) {
      newLaneInputRef.current.focus()
    }
  }, [isAddingLane])

  // ── Add a new card ──────────────────────────────────────────────────────────

  const handleAddCard = (newCard) => {
    setBoard((prev) => {
      const column = prev.columns[newCard.columnId]
      return {
        ...prev,
        cards: {
          ...prev.cards,
          [newCard.id]: newCard,
        },
        columns: {
          ...prev.columns,
          [newCard.columnId]: {
            ...column,
            cardIds: [...column.cardIds, newCard.id],
          },
        },
      }
    })
    setAddingToColumn(null)
  }

  // ── Update a card ───────────────────────────────────────────────────────────

  const handleUpdateCard = (updatedCard) => {
    setBoard((prev) => {
      const oldCard = prev.cards[updatedCard.id]
      if (!oldCard) return prev

      let columns = prev.columns

      // If the card moved columns, update both columns' cardIds arrays
      if (oldCard.columnId !== updatedCard.columnId) {
        const oldColumn = prev.columns[oldCard.columnId]
        const newColumn = prev.columns[updatedCard.columnId]
        columns = {
          ...prev.columns,
          [oldCard.columnId]: {
            ...oldColumn,
            cardIds: oldColumn.cardIds.filter((id) => id !== updatedCard.id),
          },
          [updatedCard.columnId]: {
            ...newColumn,
            cardIds: [...newColumn.cardIds, updatedCard.id],
          },
        }
      }

      return {
        ...prev,
        cards: {
          ...prev.cards,
          [updatedCard.id]: updatedCard,
        },
        columns,
      }
    })
  }

  // ── Delete a card ───────────────────────────────────────────────────────────

  const handleDeleteCard = (cardId) => {
    setBoard((prev) => {
      const card = prev.cards[cardId]
      if (!card) return prev

      // Remove the card from its column's cardIds array
      const column = prev.columns[card.columnId]
      const updatedColumn = {
        ...column,
        cardIds: column.cardIds.filter((id) => id !== cardId),
      }

      // Remove the card from the cards map
      const { [cardId]: _removed, ...remainingCards } = prev.cards

      return {
        ...prev,
        cards: remainingCards,
        columns: {
          ...prev.columns,
          [card.columnId]: updatedColumn,
        },
      }
    })
  }

  // ── Move a card (drag & drop) ──────────────────────────────────────────────

  const handleMoveCard = (cardId, targetColumnId, targetIndex) => {
    setBoard((prev) => {
      const card = prev.cards[cardId]
      if (!card) return prev

      const sourceColumnId = card.columnId
      const sourceColumn = prev.columns[sourceColumnId]
      const targetColumn = prev.columns[targetColumnId]
      if (!sourceColumn || !targetColumn) return prev

      const sourceIndex = sourceColumn.cardIds.indexOf(cardId)

      if (sourceColumnId === targetColumnId) {
        // Same column reorder
        // Adjust for the removed card: DOM still shows N elements when index was
        // calculated, but the filtered list has N-1. If dragging downward, decrement.
        let adjustedIndex = targetIndex
        if (targetIndex > sourceIndex) {
          adjustedIndex = targetIndex - 1
        }
        const clampedIndex = Math.min(adjustedIndex, sourceColumn.cardIds.length - 1)

        // Bail out if the card didn't actually move
        if (clampedIndex === sourceIndex) return prev

        const reorderedIds = [...sourceColumn.cardIds]
        reorderedIds.splice(sourceIndex, 1)
        reorderedIds.splice(clampedIndex, 0, cardId)

        return {
          ...prev,
          columns: {
            ...prev.columns,
            [sourceColumnId]: { ...sourceColumn, cardIds: reorderedIds },
          },
        }
      } else {
        // Cross-column move
        const sourceCardIds = sourceColumn.cardIds.filter((id) => id !== cardId)
        const targetCardIds = [...targetColumn.cardIds]
        const clampedIndex = Math.min(targetIndex, targetCardIds.length)
        targetCardIds.splice(clampedIndex, 0, cardId)

        return {
          ...prev,
          cards: {
            ...prev.cards,
            [cardId]: { ...card, columnId: targetColumnId },
          },
          columns: {
            ...prev.columns,
            [sourceColumnId]: { ...sourceColumn, cardIds: sourceCardIds },
            [targetColumnId]: { ...targetColumn, cardIds: targetCardIds },
          },
        }
      }
    })
  }

  // ── Add a new lane ──────────────────────────────────────────────────────────

  const handleAddLane = () => {
    const name = newLaneName.trim()
    if (!name) return

    // Prevent duplicate lane names (case-insensitive)
    const duplicate = Object.values(board.columns).some(
      (col) => col.title.toLowerCase() === name.toLowerCase()
    )
    if (duplicate) {
      alert(`A lane named "${name}" already exists.`)
      return
    }

    const colId = `col-${Date.now()}`
    setBoard((prev) => ({
      ...prev,
      columns: {
        ...prev.columns,
        [colId]: { id: colId, title: name, cardIds: [] },
      },
      columnOrder: [...prev.columnOrder, colId],
    }))
    setNewLaneName('')
    setIsAddingLane(false)
  }

  // ── Delete a lane ─────────────────────────────────────────────────────────

  const handleDeleteLane = (columnId) => {
    const column = board.columns[columnId]
    if (!column) return

    const cardCount = column.cardIds.length
    const message = cardCount > 0
      ? `Delete "${column.title}" and its ${cardCount} card${cardCount > 1 ? 's' : ''}? This cannot be undone.`
      : `Delete the empty lane "${column.title}"?`

    if (!window.confirm(message)) return

    setBoard((prev) => {
      // Remove cards that belong to this column
      const remainingCards = { ...prev.cards }
      for (const cardId of column.cardIds) {
        delete remainingCards[cardId]
      }

      // Remove the column itself
      const { [columnId]: _removed, ...remainingColumns } = prev.columns

      return {
        ...prev,
        cards: remainingCards,
        columns: remainingColumns,
        columnOrder: prev.columnOrder.filter((id) => id !== columnId),
      }
    })
  }

  // ── Reset board (dev helper) ────────────────────────────────────────────────

  const resetBoard = () => {
    if (window.confirm('Reset board to the original demo data? All changes will be lost.')) {
      setBoard(INITIAL_BOARD)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-slate-100">

      {/* Top navigation */}
      <Header />

      {/* Board toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
        <p className="text-sm text-gray-500">
          {Object.keys(board.cards).length} cards across {board.columnOrder.length} columns
        </p>
        <button
          onClick={resetBoard}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          ↺ Reset board
        </button>
      </div>

      {/* Filter bar */}
      <FilterBar
        activeFilters={activeFilters}
        onChange={setActiveFilters}
      />

      {/* Columns */}
      <div className="flex gap-4 p-6 overflow-x-auto flex-1 items-start">
        {board.columnOrder.map((colId) => {
          const column = board.columns[colId]
          if (!column) return null
          const visibleCardIds = column.cardIds.filter((id) => id in filteredCards)
          const isDefault = colId in INITIAL_BOARD.columns
          return (
            <Column
              key={colId}
              column={column}
              cards={board.cards}
              filteredCardIds={visibleCardIds}
              isFiltering={countActiveFilters(activeFilters) > 0}
              onAddCard={setAddingToColumn}
              onViewCard={setViewingCardId}
              onDeleteCard={handleDeleteCard}
              onMoveCard={handleMoveCard}
              onDeleteLane={isDefault ? undefined : handleDeleteLane}
            />
          )
        })}

        {/* Add lane */}
        <div className="shrink-0 w-72">
          {isAddingLane ? (
            <div className="bg-gray-100 rounded-xl border border-gray-200 p-3">
              <input
                ref={newLaneInputRef}
                type="text"
                value={newLaneName}
                onChange={(e) => setNewLaneName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddLane()
                  if (e.key === 'Escape') { setIsAddingLane(false); setNewLaneName('') }
                }}
                placeholder="Enter lane name..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAddLane}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600
                             hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Add Lane
                </button>
                <button
                  onClick={() => { setIsAddingLane(false); setNewLaneName('') }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700
                             bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingLane(true)}
              className="w-full py-3 text-sm font-medium text-gray-500 hover:text-indigo-700
                         bg-gray-100 hover:bg-white border-2 border-dashed border-gray-300
                         hover:border-indigo-300 rounded-xl transition-all"
            >
              + Add lane
            </button>
          )}
        </div>
      </div>

      {/* Add card modal */}
      {addingToColumn && (
        <AddCardModal
          defaultColumnId={addingToColumn}
          columns={board.columnOrder.map((id) => board.columns[id]).filter(Boolean)}
          onSave={handleAddCard}
          onClose={() => setAddingToColumn(null)}
        />
      )}

      {/* Card detail popup */}
      {viewingCardId && board.cards[viewingCardId] && (
        <CardDetailModal
          card={board.cards[viewingCardId]}
          columns={board.columns}
          columnOrder={board.columnOrder}
          board={board}
          setBoard={setBoard}
          onSave={handleUpdateCard}
          onClose={() => setViewingCardId(null)}
        />
      )}

    </div>
  )
}
