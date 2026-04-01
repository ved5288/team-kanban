import { useState } from 'react'
import { INITIAL_BOARD } from '../data/mockData'
import { useLocalStorage } from '../hooks/useLocalStorage'
import Header from './Header'
import Column from './Column'
import AddCardModal from './AddCardModal'

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

      // Remove card from source column
      const sourceIndex = sourceColumn.cardIds.indexOf(cardId)
      const sourceCardIds = sourceColumn.cardIds.filter((id) => id !== cardId)

      let targetCardIds
      if (sourceColumnId === targetColumnId) {
        targetCardIds = [...sourceCardIds]
        // Adjust for the removed card: DOM still shows N elements when index was
        // calculated, but the filtered list has N-1. If dragging downward, decrement.
        let adjustedIndex = targetIndex
        if (targetIndex > sourceIndex) {
          adjustedIndex = targetIndex - 1
        }
        const clampedIndex = Math.min(adjustedIndex, targetCardIds.length)
        targetCardIds.splice(clampedIndex, 0, cardId)
      } else {
        targetCardIds = [...targetColumn.cardIds]
        const clampedIndex = Math.min(targetIndex, targetCardIds.length)
        targetCardIds.splice(clampedIndex, 0, cardId)
      }

      const updatedColumns = { ...prev.columns }
      updatedColumns[sourceColumnId] = { ...sourceColumn, cardIds: sourceCardIds }
      updatedColumns[targetColumnId] = { ...targetColumn, cardIds: targetCardIds }

      return {
        ...prev,
        cards: {
          ...prev.cards,
          [cardId]: { ...card, columnId: targetColumnId },
        },
        columns: updatedColumns,
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

      {/* Columns */}
      <div className="flex gap-4 p-6 overflow-x-auto flex-1 items-start">
        {board.columnOrder.map((colId) => {
          const column = board.columns[colId]
          if (!column) return null
          return (
            <Column
              key={colId}
              column={column}
              cards={board.cards}
              onAddCard={setAddingToColumn}
              onDeleteCard={handleDeleteCard}
              onMoveCard={handleMoveCard}
            />
          )
        })}
      </div>

      {/* Add card modal */}
      {addingToColumn && (
        <AddCardModal
          defaultColumnId={addingToColumn}
          onSave={handleAddCard}
          onClose={() => setAddingToColumn(null)}
        />
      )}

    </div>
  )
}
